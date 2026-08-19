"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, ImageUp, RefreshCcw } from "lucide-react";

import { Alert, Button, Card } from "@/components/ui";

type Mode = "camera" | "upload" | "preview";

export function PhotoCapture() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidate/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.photoUrl) {
          setExisting(d.profile.photoUrl);
          setMode("preview");
        }
      })
      .catch(() => {});
  }, []);

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (mode !== "camera") {
      stopStream();
      return;
    }
    let cancelled = false;
    setCameraError(null);
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraError("Camera is not supported on this device/browser.");
          setMode("upload");
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        await fetch("/api/candidate/checkin", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ granted: true }),
        });
      } catch {
        if (!cancelled) {
          setCameraError(
            "Camera access was denied or unavailable. You can upload a photo file instead."
          );
          await fetch("/api/candidate/checkin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ denied: true }),
          }).catch(() => {});
          setMode("upload");
        }
      }
    }
    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [mode, stopStream]);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setCameraError("Camera feed is not ready yet. Please try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/webp", 0.9);
    setCaptured(dataUrl);
    setMode("preview");
    stopStream();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be 5 MB or smaller.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCaptured(String(reader.result));
    reader.readAsDataURL(file);
    setMode("preview");
  }

  async function submitCapture() {
    if (!captured) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const blob = await (await fetch(captured)).blob();
      const file = new File([blob], "photo.webp", { type: "image/webp" });
      const body = new FormData();
      body.append("photo", file);
      const res = await fetch("/api/candidate/photo", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setSuccess("Photo saved. You can now continue to the assessment instructions.");
      setExisting(data.photoUrl);
      setCaptured(null);
      setTimeout(() => {
        router.push("/candidate/instructions");
        router.refresh();
      }, 900);
    } catch {
      setError("Something went wrong while saving your photo.");
    } finally {
      setSaving(false);
    }
  }

  function retake() {
    setCaptured(null);
    setMode("camera");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5">
          <h1 className="text-lg font-bold text-slate-900">
            {existing ? "Your photograph" : "Submit your photograph"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            A clear photo of your face is required for identity verification
            before the assessment can start. It will only be visible to the
            recruitment team.
          </p>
        </div>

        <div className="px-6 py-6">
          {error ? (
            <Alert tone="danger" className="mb-4">
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert tone="success" className="mb-4">
              {success}
            </Alert>
          ) : null}

          {mode === "preview" && (captured || existing) ? (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={captured ?? existing ?? ""}
                  alt="Candidate photo preview"
                  className="mx-auto max-h-96 w-full object-contain bg-slate-100"
                />
              </div>
              {captured ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={retake}>
                    <RefreshCcw className="h-4 w-4" /> Retake
                  </Button>
                  <Button onClick={submitCapture} loading={saving}>
                    {existing ? "Update" : "Save"} photograph
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="mb-4 text-sm text-slate-500">
                    Your photo is already saved.
                  </p>
                  <Button onClick={() => setMode("camera")} variant="outline">
                    Change photo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] object-cover"
                />
                {cameraError ? (
                  <div className="bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {cameraError}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={capture}>
                  <CameraIcon className="h-4 w-4" /> Capture photo
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <ImageUp className="h-4 w-4" /> Upload from device
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onFile}
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                Authorized camera &amp; photo use is limited to identity
                verification. No footage is recorded or uploaded.
              </p>
            </div>
          )}
        </div>
      </Card>

      {existing && !captured ? (
        <div className="mt-6 text-center">
          <a
            href="/candidate/instructions"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Continue to assessment instructions →
          </a>
        </div>
      ) : null}
    </div>
  );
}