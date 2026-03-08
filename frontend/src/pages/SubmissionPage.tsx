import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import ThirstiControlPanel from "../components/Graphics/ControlPanel";
import { apiClient } from "../services/api";

function SubmissionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    sparkleLevel: 2,
    sizeOz: 12,
    flavorLevel: 1,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!code) {
      setError("No submission code provided in the URL (?code=...)");
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await apiClient.get<any>(
          `/api/machine/settings?code=${code}`,
        );
        setSettings({
          sparkleLevel: res.sparkle_level,
          sizeOz: res.size_oz,
          flavorLevel: res.flavor_level,
        });
      } catch (err: any) {
        setError(err.message || "Invalid code or failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [code]);

  const handleSettingChange = (setting: string, value: number) => {
    setSettings((prev) => ({ ...prev, [setting]: value }));
  };

  const handleDispense = async () => {
    if (!code) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/api/machine/dispense?code=${code}`, {
        sparkle_level: settings.sparkleLevel,
        size_oz: settings.sizeOz,
        flavor_level: settings.flavorLevel,
      });
      setConfirmOpen(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/");
      }, 2000);
    } catch (err) {
      alert("Failed to log dispense.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error" variant="h5">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#121212",
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 4, color: "#00BFFF", fontWeight: "bold" }}
      >
        Submit your dispense
      </Typography>

      <ThirstiControlPanel
        settings={settings}
        onSettingChange={handleSettingChange}
        onSubmit={() => setConfirmOpen(true)}
      />

      {success && (
        <Typography sx={{ mt: 3, color: "#4caf50", fontWeight: "bold" }}>
          Dispense logged successfully!
        </Typography>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1E1E1E", color: "#fff" } }}
      >
        <DialogTitle>Confirm Dispense?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to log this dispense with the current
            settings?
          </Typography>
          <ul>
            <li>Size: {settings.sizeOz}oz</li>
            <li>
              Sparkle Level:{" "}
              {settings.sparkleLevel === 0 ? "Still" : settings.sparkleLevel}
            </li>
            <li>Flavor Level: {settings.flavorLevel}</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "#aaa" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDispense}
            disabled={submitting}
            sx={{ color: "#00BFFF", fontWeight: "bold" }}
          >
            {submitting ? "Logging..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SubmissionPage;
