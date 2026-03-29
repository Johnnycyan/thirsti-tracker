import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import ThirstiControlPanel from "../components/Graphics/ControlPanel";
import { apiClient } from "../services/api";

interface FlavorOption {
  name: string;
  color_hex: string;
}

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
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openConfirm = useCallback(() => {
    setCountdown(5);
    setConfirmOpen(true);
  }, []);

  useEffect(() => {
    if (confirmOpen && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [confirmOpen, countdown]);

  const [installedFlavor, setInstalledFlavor] = useState<FlavorOption | null>(
    null,
  );
  const [extraFlavors, setExtraFlavors] = useState<FlavorOption[]>([]);
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");

  useEffect(() => {
    if (!code) {
      setError("No submission code provided in the URL (?code=...)");
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const [settingsRes, flavorsRes] = await Promise.all([
          apiClient.get<any>(`/api/machine/settings?code=${code}`),
          apiClient.get<any>(`/api/machine/flavors?code=${code}`),
        ]);
        setSettings({
          sparkleLevel: settingsRes.sparkle_level,
          sizeOz: settingsRes.size_oz,
          flavorLevel: settingsRes.flavor_level,
        });
        if (flavorsRes.installed) {
          setInstalledFlavor(flavorsRes.installed);
          setSelectedFlavor(flavorsRes.installed.name);
        }
        setExtraFlavors(flavorsRes.extras || []);
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
        flavor_name: settings.flavorLevel > 0 ? selectedFlavor : "",
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mb: 2,
          width: "100%",
        }}
      >
        <Divider sx={{ flexGrow: 1, borderColor: "#333", maxWidth: 400 }} />
        <Typography
          variant="h5"
          sx={{
            color: "#fff",
            fontWeight: 900,
            letterSpacing: "2px",
            textTransform: "uppercase",
            background: "-webkit-linear-gradient(45deg, #00BFFF, #FF00FF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textAlign: "center",
          }}
        >
          Thirsti Usage Tracking
        </Typography>
        <Divider sx={{ flexGrow: 1, borderColor: "#333", maxWidth: 400 }} />
      </Box>
      <Typography variant="h6" sx={{ color: "#ffffff" }}>
        This tracks the usage of the Thirsti machine.
      </Typography>
      <Typography variant="h6" sx={{ mb: 4, color: "#ffffff" }}>
        Please enter the settings you used and hit SUBMIT
      </Typography>

      <ThirstiControlPanel
        settings={settings}
        onSettingChange={handleSettingChange}
        onSubmit={openConfirm}
      />

      {/* Flavor Selector */}
      {settings.flavorLevel > 0 &&
        (installedFlavor || extraFlavors.length > 0) && (
          <Box
            sx={{
              mt: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Select Flavor
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "center",
              }}
            >
              {/* Deduplicate: show installed + extras that aren't the same name as installed */}
              {installedFlavor && (
                <Chip
                  label={installedFlavor.name}
                  onClick={() => setSelectedFlavor(installedFlavor.name)}
                  sx={{
                    bgcolor:
                      selectedFlavor === installedFlavor.name
                        ? installedFlavor.color_hex + "33"
                        : "#2a2a2a",
                    color: "#fff",
                    border:
                      selectedFlavor === installedFlavor.name
                        ? `2px solid ${installedFlavor.color_hex}`
                        : "1px solid #555",
                    fontWeight:
                      selectedFlavor === installedFlavor.name
                        ? "bold"
                        : "normal",
                    "&:hover": { bgcolor: installedFlavor.color_hex + "22" },
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: installedFlavor.color_hex,
                        ml: 1,
                      }}
                    />
                  }
                />
              )}
              {extraFlavors
                .filter(
                  (f) => !installedFlavor || f.name !== installedFlavor.name,
                )
                .map((flavor) => (
                  <Chip
                    key={flavor.name}
                    label={flavor.name}
                    onClick={() => setSelectedFlavor(flavor.name)}
                    sx={{
                      bgcolor:
                        selectedFlavor === flavor.name
                          ? flavor.color_hex + "33"
                          : "#2a2a2a",
                      color: "#fff",
                      border:
                        selectedFlavor === flavor.name
                          ? `2px solid ${flavor.color_hex}`
                          : "1px solid #555",
                      fontWeight:
                        selectedFlavor === flavor.name ? "bold" : "normal",
                      "&:hover": { bgcolor: flavor.color_hex + "22" },
                    }}
                    icon={
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: flavor.color_hex,
                          ml: 1,
                        }}
                      />
                    }
                  />
                ))}
            </Box>
          </Box>
        )}

      {success && (
        <Typography sx={{ mt: 3, color: "#4caf50", fontWeight: "bold" }}>
          Usage logged successfully!
        </Typography>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#1E1E1E",
            color: "#fff",
            border: "1px solid #00BFFF55",
            borderRadius: 3,
            minWidth: 340,
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: 900,
            fontSize: "1.4rem",
            pb: 0,
          }}
        >
          Confirm Usage?
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              textAlign: "center",
              color: "#FFD600",
              fontWeight: 700,
              fontSize: "0.95rem",
              mt: 1,
              mb: 2,
            }}
          >
            Please verify these settings are correct before confirming.
          </Typography>
          <Box
            sx={{
              bgcolor: "#00BFFF12",
              border: "1px solid #00BFFF44",
              borderRadius: 2,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#aaa" }}>Size</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {settings.sizeOz} oz
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "#333" }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#aaa" }}>Sparkle Level</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {settings.sparkleLevel === 0 ? "Still" : settings.sparkleLevel}
              </Typography>
            </Box>
            <Divider sx={{ borderColor: "#333" }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography sx={{ color: "#aaa" }}>Flavor Level</Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {settings.flavorLevel}
              </Typography>
            </Box>
            {settings.flavorLevel > 0 && selectedFlavor && (
              <>
                <Divider sx={{ borderColor: "#333" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography sx={{ color: "#aaa" }}>Flavor</Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {selectedFlavor}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
            sx={{
              color: "#aaa",
              borderColor: "#555",
              "&:hover": { borderColor: "#888", bgcolor: "#ffffff0a" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDispense}
            disabled={submitting || countdown > 0}
            variant="contained"
            sx={{
              fontWeight: "bold",
              minWidth: 120,
              bgcolor: countdown > 0 ? "#333" : "#00BFFF",
              color: countdown > 0 ? "#888" : "#000",
              "&:hover": { bgcolor: "#00a0dd" },
              "&.Mui-disabled": {
                bgcolor: "#333",
                color: "#888",
              },
            }}
          >
            {submitting
              ? "Logging..."
              : countdown > 0
                ? `Confirm (${countdown})`
                : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SubmissionPage;
