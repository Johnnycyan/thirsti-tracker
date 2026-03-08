import { Box, Typography } from "@mui/material";
import { styled } from "@mui/system";

interface ControlPanelProps {
  settings: {
    sparkleLevel: number;
    sizeOz: number;
    flavorLevel: number;
  };
  onSettingChange: (setting: string, value: number) => void;
  onSubmit: () => void;
}

// Styled component for physical button depression
const PhysicalButton = styled(Box)(() => ({
  cursor: "pointer",
  transition: "transform 0.1s, box-shadow 0.1s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  "&:active": {
    transform: "scale(0.95) translateY(2px)",
  },
}));

export default function ThirstiControlPanel({
  settings,
  onSettingChange,
  onSubmit,
}: ControlPanelProps) {
  // Handlers for cycling values
  const handleSparkleClick = () => {
    // Cycles 1 -> 2 -> 3 -> 0 -> 1
    const nextValue =
      settings.sparkleLevel === 3 ? 0 : settings.sparkleLevel + 1;
    onSettingChange("sparkleLevel", nextValue);
  };

  const handleSizeClick = () => {
    // Cycles 6 -> 12 -> 18 -> 24 -> 6
    let nextValue = 6;
    if (settings.sizeOz === 6) nextValue = 12;
    else if (settings.sizeOz === 12) nextValue = 18;
    else if (settings.sizeOz === 18) nextValue = 24;

    onSettingChange("sizeOz", nextValue);
  };

  const handleFlavorLeftClick = () => {
    // Cycles 0 -> 1 -> 2 -> 0
    const nextValue = settings.flavorLevel === 2 ? 0 : settings.flavorLevel + 1;
    onSettingChange("flavorLevel", nextValue);
  };

  // Visual helper for lights
  const getLightColor = (isActive: boolean) => (isActive ? "#00BFFF" : "#555");

  return (
    <Box
      sx={{
        backgroundColor: "#1E1E1E",
        borderRadius: "24px",
        padding: "30px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "40px",
        minWidth: "250px",
        maxWidth: "500px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        userSelect: "none",
      }}
    >
      {/* Top Row: Sparkling and Size */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
        }}
      >
        {/* Sparkling Container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            flexBasis: "50%",
          }}
        >
          <PhysicalButton onClick={handleSparkleClick}>
            <svg width="60" height="60" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="23"
                fill="#2a2a2a"
                stroke="#444"
                strokeWidth="2"
              />
              <circle cx="25" cy="18" r="4" fill="#fff" />
              <circle cx="18" cy="28" r="3" fill="#fff" />
              <circle cx="32" cy="30" r="5" fill="#fff" />
            </svg>
          </PhysicalButton>
          {/* Lights (0 = Line, 1-3 = Dots) */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              mt: 2,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", gap: "6px" }}>
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: getLightColor(settings.sparkleLevel >= 1),
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: getLightColor(settings.sparkleLevel >= 2),
                }}
              />
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: getLightColor(settings.sparkleLevel === 3),
                }}
              />
            </Box>
            <Box
              sx={{
                width: 16,
                height: 4,
                borderRadius: "2px",
                backgroundColor: getLightColor(settings.sparkleLevel === 0),
              }}
            />
          </Box>
        </Box>

        {/* Size Container */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            flexBasis: "50%",
          }}
        >
          <PhysicalButton onClick={handleSizeClick}>
            <svg width="60" height="60" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="23"
                fill="#2a2a2a"
                stroke="#444"
                strokeWidth="2"
              />
              <rect x="18" y="15" width="14" height="20" fill="#fff" rx="2" />
            </svg>
          </PhysicalButton>
          {/* Size Lights */}
          <Box sx={{ display: "flex", gap: "10px", mt: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: getLightColor(settings.sizeOz === 6),
                fontWeight: "bold",
              }}
            >
              6
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: getLightColor(settings.sizeOz === 12),
                fontWeight: "bold",
              }}
            >
              12
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: getLightColor(settings.sizeOz === 18),
                fontWeight: "bold",
              }}
            >
              18
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: getLightColor(settings.sizeOz === 24),
                fontWeight: "bold",
              }}
            >
              24
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Middle Row: Flavor Pods */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
          mt: 2,
        }}
      >
        {/* Left Flavor Container (Active) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            flexBasis: "50%",
          }}
        >
          <PhysicalButton
            onClick={handleFlavorLeftClick}
            sx={{ borderRadius: "8px" }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60">
              <rect
                x="5"
                y="5"
                width="50"
                height="50"
                rx="8"
                fill="#2a2a2a"
                stroke="#444"
                strokeWidth="2"
              />
              <text
                x="30"
                y="38"
                fill="#fff"
                fontSize="24"
                textAnchor="middle"
                fontWeight="bold"
              >
                1
              </text>
            </svg>
          </PhysicalButton>
          {/* Lights */}
          <Box sx={{ display: "flex", gap: "8px", mt: 2 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: getLightColor(settings.flavorLevel >= 1),
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: getLightColor(settings.flavorLevel === 2),
              }}
            />
          </Box>
        </Box>

        {/* Right Flavor Container (Disabled) */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            flexBasis: "50%",
          }}
        >
          <Box
            sx={{
              cursor: "default",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="60" height="60" viewBox="0 0 60 60">
              <rect
                x="5"
                y="5"
                width="50"
                height="50"
                rx="8"
                fill="#1a1a1a"
                stroke="#333"
                strokeWidth="2"
              />
              <text
                x="30"
                y="38"
                fill="#555"
                fontSize="24"
                textAnchor="middle"
                fontWeight="bold"
              >
                2
              </text>
            </svg>
          </Box>
          <Box sx={{ display: "flex", gap: "8px", mt: 2 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#444",
              }}
            />
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#444",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Bottom: Submit Button Container */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <PhysicalButton onClick={onSubmit} sx={{ borderRadius: "40px" }}>
          <Box
            sx={{
              background: "linear-gradient(135deg, #00BFFF 0%, #008B8B 100%)",
              borderRadius: "40px",
              padding: "16px 48px",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "18px",
              boxShadow: "0 4px 15px rgba(0, 191, 255, 0.4)",
              letterSpacing: "2px",
            }}
          >
            SUBMIT
          </Box>
        </PhysicalButton>
      </Box>
    </Box>
  );
}
