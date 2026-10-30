import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
} from "lucide-react";
import { api, apiMessage } from "../../lib/api";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, FormField } from "../ui/Field";
import { FileDropzone } from "../forms/FileDropzone";
import { money } from "../../lib/utils";
import qrPaymentImage from "../../assets/qr-payment.jpeg";

export function QrPaymentModal({ open, onClose, order, onVerified }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [proofFiles, setProofFiles] = useState([]);
  const [step, setStep] = useState("qr"); // 'qr' | 'proof' | 'submitted'
  const [error, setError] = useState("");

  const upiId = "9825751614-2@ybl"; // Replace with your actual UPI ID
  const accountName = "Acadexa Consultancy";
  const amount = order?.agreedAmount || 0;
  const currency = order?.currency || "INR";

  const createPendingPayment = async () => {
    setBusy(true);
    setError("");
    try {
      // Upload payment proof first
      let fileIds = [];
      if (proofFiles.length > 0) {
        const formData = new FormData();
        proofFiles.forEach((f) => formData.append("files", f));
        formData.append("purpose", "payment-proof");
        const { data } = await api.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileIds = (data.files || []).map((f) => f._id);
      }

      const { data } = await api.post("/payments/qr-create", {
        orderId: order._id,
        amount,
        currency,
        upiId,
        fileIds,
      });

      setStep("submitted");
      toast.success(
        "Payment proof submitted. We will verify and confirm your order shortly.",
      );
      qc.invalidateQueries();
      onVerified?.();
    } catch (err) {
      setError(apiMessage(err, "Could not submit payment proof."));
    } finally {
      setBusy(false);
    }
  };

  const handleProofChange = (files) => {
    setProofFiles(files);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={step === "submitted" ? "Payment Submitted" : "Pay via QR Code"}
      description={
        step === "submitted"
          ? `Your payment proof for ${order?.reference} has been submitted for verification.`
          : `${order?.reference} · Scan to pay ${money(amount, currency)}`
      }
      footer={
        step === "submitted" ? (
          <Button onClick={onClose}>Done</Button>
        ) : step === "proof" ? (
          <>
            <Button variant="secondary" onClick={() => setStep("qr")}>
              Back to QR
            </Button>
            <Button
              loading={busy}
              onClick={createPendingPayment}
              disabled={proofFiles.length === 0}
            >
              Submit Payment Proof
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() => setStep("proof")}
              icon={Upload}
            >
              I've Paid — Upload Proof
            </Button>
          </>
        )
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] font-medium text-danger"
        >
          {error}
        </div>
      )}

      {step === "qr" ? (
        <div className="space-y-4">
          {/* QR Code Image */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-canvas p-6">
            <img
              src={qrPaymentImage}
              alt="Payment QR Code"
              className="max-w-md max-h-[400px] w-full h-auto object-cover rounded-xl shadow-sm"
              loading="eager"
            />
          </div>

          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
              <span className="text-[12px] text-muted">Amount to pay</span>
              <span className="font-display text-xl font-bold text-forest">
                {money(amount, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
              <span className="text-[12px] text-muted">UPI ID</span>
              <span className="font-mono text-[12px] text-ink break-all">
                {upiId}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
              <span className="text-[12px] text-muted">Account name</span>
              <span className="text-[12px] text-ink">{accountName}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-white">
              <span className="text-[12px] text-muted">Order reference</span>
              <span className="font-mono text-[12px] text-ink">
                {order?.reference}
              </span>
            </div>
          </div>

          <p className="text-[11.5px] leading-relaxed text-muted text-center">
            Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)
            to pay. After payment, upload a screenshot of the transaction as
            proof.
          </p>
        </div>
      ) : step === "proof" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-[12px] font-semibold text-ink">
              Upload payment proof
            </p>
            <p className="mt-1 text-[11.5px] text-muted">
              Please upload a screenshot or receipt of your UPI transaction.
              We'll verify it and confirm your order.
            </p>
          </div>

          <FormField
            label="Payment proof (screenshot/receipt)"
            htmlFor="proof-upload"
            required
            error={
              proofFiles.length === 0
                ? "Please upload proof of payment."
                : undefined
            }
          >
            <FileDropzone
              files={proofFiles}
              onChange={handleProofChange}
              purpose="payment-proof"
              maxFiles={3}
              maxMb={10}
              label="Upload payment proof"
            />
          </FormField>

          {proofFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-forest">
                {proofFiles.length} file(s) selected
              </p>
              <ul className="space-y-1 text-[11px] text-muted">
                {proofFiles.map((f) => (
                  <li key={f._id} className="flex items-center gap-2">
                    <FileText className="size-3.5 text-forest" aria-hidden />
                    <span className="truncate">{f.originalName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald text-forest mb-4">
            <CheckCircle2 className="size-7" aria-hidden />
          </div>
          <h3 className="text-lg font-bold text-ink">
            Payment proof submitted
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Your payment proof has been submitted for verification. Once
            verified by our team, your order will be confirmed.
          </p>
        </div>
      )}
    </Modal>
  );
}
