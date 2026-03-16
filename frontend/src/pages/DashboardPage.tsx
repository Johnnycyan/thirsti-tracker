import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiClient } from "../services/api";
import CO2TankGraphic from "../components/Graphics/CO2TankGraphic";
import FlavorPodGraphic from "../components/Graphics/FlavorPodGraphic";

function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, statsRes] = await Promise.all([
          apiClient.get<any>("/api/dashboard"),
          apiClient.get<any>("/api/analytics"),
        ]);
        setData(dashRes);
        setAnalyticsData(statsRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const chartData = useMemo(() => {
    if (!analyticsData?.all_dispenses) return [];
    const dailyDoses: Record<
      string,
      { date: string; co2: number; flavor: number }
    > = {};
    analyticsData.all_dispenses.forEach((log: any) => {
      const d = new Date(log.created_at).toLocaleDateString();
      if (!dailyDoses[d]) {
        dailyDoses[d] = { date: d, co2: 0, flavor: 0 };
      }
      dailyDoses[d].co2 += log.co2_doses;
      dailyDoses[d].flavor += log.flavor_doses;
    });
    return Object.values(dailyDoses);
  }, [analyticsData]);

  const avgDosesPerDay = useMemo(() => {
    if (chartData.length === 0) return { co2: 0, flavor: 0 };
    const totalCo2 = chartData.reduce((sum, day) => sum + day.co2, 0);
    const totalFlavor = chartData.reduce((sum, day) => sum + day.flavor, 0);
    return {
      co2: Math.round((totalCo2 / chartData.length) * 10) / 10,
      flavor: Math.round((totalFlavor / chartData.length) * 10) / 10,
    };
  }, [chartData]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Typography color="error" sx={{ p: 4 }}>
        Failed to load dashboard data.
      </Typography>
    );
  }

  const { current_co2, current_flavor, inventory, analytics, spending } = data;

  const co2Doses = current_co2?.doses_used || 0;
  const flavorDoses = current_flavor?.doses_used || 0;
  const flavorName = current_flavor?.name || "None";
  const flavorColor = current_flavor?.color_hex || "#555555";

  const fmt$ = (v: number) => `$${v.toFixed(2)}`;
  const fmt$3 = (v: number) => `$${v.toFixed(3)}`;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
      }}
    >
      {/* Top Section: Current Status */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
          mb: 6,
        }}
      >
        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            textAlign: "center",
            p: 2,
            width: { xs: "100%", md: "45%" },
            maxWidth: 500,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              height: 240,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              pb: 2,
            }}
          >
            {current_co2 && current_co2.id ? (
              <CO2TankGraphic status="full" height={220} width={80} />
            ) : (
              <Typography color="gray">No Tank Installed</Typography>
            )}
          </Box>
          <Box sx={{ mt: "auto" }}>
            <Typography
              variant="h5"
              sx={{ color: current_co2?.id ? "#00BFFF" : "#555555" }}
            >
              {current_co2?.id
                ? current_co2.status === "empty"
                  ? "Empty CO2"
                  : "Full CO2"
                : "None"}
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
              {co2Doses}
            </Typography>
            <Typography variant="subtitle1" color="gray">
              Doses Used
            </Typography>
            {analytics?.avg_co2_doses > 0 && current_co2?.id && (
              <Typography
                variant="body2"
                color="#00BFFF"
                sx={{ mt: 1, fontWeight: "bold" }}
              >
                Est. Remaining:{" "}
                {Math.max(0, Math.round(analytics.avg_co2_doses - co2Doses))}{" "}
                doses
              </Typography>
            )}
          </Box>
          <Divider sx={{ my: 2, borderColor: "#333" }} />
          <Typography sx={{ mt: 2, color: "#aaa", mb: 1 }}>
            Extras in Stock:{" "}
            {(inventory?.co2_full?.length || 0) +
              (inventory?.co2_empty?.length || 0)}
          </Typography>
          {/* Fixed: use flex-start so items aren't clipped on left side on mobile */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              p: 1,
              justifyContent: "flex-start",
              height: 120,
              alignItems: "flex-end",
            }}
          >
            {inventory?.co2_full?.map((_: any, i: number) => (
              <Box
                key={`full-${i}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                <CO2TankGraphic status="full" height={80} width={30} />
                <Typography
                  variant="caption"
                  sx={{ mt: 1, whiteSpace: "nowrap" }}
                >
                  Full CO2
                </Typography>
              </Box>
            ))}
            {inventory?.co2_empty?.map((_: any, i: number) => (
              <Box
                key={`empty-${i}`}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 60,
                  flexShrink: 0,
                  opacity: 0.5,
                }}
              >
                <CO2TankGraphic status="empty" height={80} width={30} />
                <Typography
                  variant="caption"
                  sx={{ mt: 1, whiteSpace: "nowrap" }}
                >
                  Empty CO2
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>

        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            textAlign: "center",
            p: 2,
            width: { xs: "100%", md: "45%" },
            maxWidth: 500,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              height: 240,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              pb: 2,
            }}
          >
            {current_flavor && current_flavor.id ? (
              <FlavorPodGraphic
                name={flavorName}
                colorHex={flavorColor}
                height={140}
                width={100}
              />
            ) : (
              <Typography color="gray">No Pod Installed</Typography>
            )}
          </Box>
          <Box sx={{ mt: "auto" }}>
            <Typography variant="h5" sx={{ color: flavorColor }}>
              {flavorName}
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
              {flavorDoses}
            </Typography>
            <Typography variant="subtitle1" color="gray">
              Doses Used
            </Typography>
            {analytics?.avg_flavor_doses > 0 && current_flavor?.id && (
              <Typography
                variant="body2"
                color="#FF00FF"
                sx={{ mt: 1, fontWeight: "bold" }}
              >
                Est. Remaining:{" "}
                {Math.max(
                  0,
                  Math.round(analytics.avg_flavor_doses - flavorDoses),
                )}{" "}
                doses
              </Typography>
            )}
          </Box>
          <Divider sx={{ my: 2, borderColor: "#333" }} />
          <Typography sx={{ mt: 2, color: "#aaa", mb: 1 }}>
            Extras in Stock: {inventory?.flavor_extra?.length || 0}
          </Typography>
          {/* Fixed: use flex-start so items aren't clipped on left side on mobile */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              p: 1,
              justifyContent: "flex-start",
              height: 120,
              alignItems: "flex-end",
            }}
          >
            {inventory?.flavor_extra?.map((pod: any) => (
              <Box
                key={pod.id}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                <FlavorPodGraphic
                  name={pod.name}
                  colorHex={pod.color_hex}
                  height={60}
                  width={40}
                />
                <Typography
                  variant="caption"
                  sx={{ mt: 1, whiteSpace: "nowrap" }}
                >
                  {pod.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Divider sx={{ flexGrow: 1, borderColor: "#333", maxWidth: 200 }} />
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
          }}
        >
          Analytics
        </Typography>
        <Divider sx={{ flexGrow: 1, borderColor: "#333", maxWidth: 200 }} />
      </Box>

      {/* High-Level Averages */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
          mb: 6,
        }}
      >
        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            p: 3,
            width: { xs: "100%", md: "30%" },
            maxWidth: 400,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            border: "1px solid #2a2a2a",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #00BFFF, #0090cc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CO2 Averages
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
            Avg Doses / Tank:{" "}
            <strong style={{ color: "#00BFFF" }}>
              {analytics?.avg_co2_doses || 0}
            </strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
            Avg Days / Tank:{" "}
            <strong style={{ color: "#00BFFF" }}>
              {analytics?.avg_co2_days || 0}
            </strong>
          </Typography>
          <Divider sx={{ my: 1.5, borderColor: "#333" }} />
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            Avg Doses / Day:{" "}
            <strong style={{ color: "#00BFFF" }}>{avgDosesPerDay.co2}</strong>
          </Typography>
        </Card>

        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            p: 3,
            width: { xs: "100%", md: "30%" },
            maxWidth: 400,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            border: "1px solid #2a2a2a",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 3,
              fontWeight: "bold",
              background: "linear-gradient(45deg, #FF00FF, #cc00cc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Flavor Averages
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
            Avg Doses / Pod:{" "}
            <strong style={{ color: "#FF00FF" }}>
              {analytics?.avg_flavor_doses || 0}
            </strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
            Avg Days / Pod:{" "}
            <strong style={{ color: "#FF00FF" }}>
              {analytics?.avg_flavor_days || 0}
            </strong>
          </Typography>
          <Divider sx={{ my: 1.5, borderColor: "#333" }} />
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            Avg Doses / Day:{" "}
            <strong style={{ color: "#FF00FF" }}>
              {avgDosesPerDay.flavor}
            </strong>
          </Typography>
        </Card>

        {/* Spending Card */}
        {spending && (
          <Card
            sx={{
              bgcolor: "#1E1E1E",
              color: "#fff",
              borderRadius: 4,
              p: 3,
              width: { xs: "100%", md: "30%" },
              maxWidth: 400,
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              border: "1px solid #2a2a2a",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 3,
                fontWeight: "bold",
                background: "linear-gradient(45deg, #FFD700, #FFA500)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Spending
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              Total Spent:{" "}
              <strong style={{ color: "#FFD700" }}>
                {fmt$(spending.total_spent || 0)}
              </strong>
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: "#333" }} />
            <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
              CO2:{" "}
              <strong style={{ color: "#00BFFF" }}>
                {fmt$(spending.total_co2_spent || 0)}
              </strong>{" "}
              · avg{" "}
              <strong style={{ color: "#00BFFF" }}>
                {fmt$(spending.avg_cost_per_co2 || 0)}
              </strong>{" "}
              / tank
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5, color: "#aaa" }}>
              Flavor:{" "}
              <strong style={{ color: "#FF00FF" }}>
                {fmt$(spending.total_flavor_spent || 0)}
              </strong>{" "}
              · avg{" "}
              <strong style={{ color: "#FF00FF" }}>
                {fmt$(spending.avg_cost_per_flavor_pod || 0)}
              </strong>{" "}
              / pod
            </Typography>
            <Divider sx={{ my: 1.5, borderColor: "#333" }} />
            {spending.has_co2_dose_data ? (
              <Typography variant="body2" sx={{ mb: 0.5, color: "#aaa" }}>
                CO2 cost / dose:{" "}
                <strong style={{ color: "#00BFFF" }}>
                  {fmt$3(spending.avg_cost_per_co2_dose || 0)}
                </strong>
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ mb: 0.5, color: "#555" }}>
                CO2 cost / dose: <em>awaiting data</em>
              </Typography>
            )}
            {spending.has_flavor_dose_data ? (
              <Typography variant="body2" sx={{ color: "#aaa" }}>
                Flavor cost / dose:{" "}
                <strong style={{ color: "#FF00FF" }}>
                  {fmt$3(spending.avg_cost_per_flavor_dose || 0)}
                </strong>
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: "#555" }}>
                Flavor cost / dose: <em>awaiting data</em>
              </Typography>
            )}
          </Card>
        )}
      </Box>

      {/* Usage Graph */}
      <Card
        sx={{
          bgcolor: "#1E1E1E",
          color: "#fff",
          borderRadius: 4,
          p: 4,
          mb: 6,
          mx: "auto",
          maxWidth: 1000,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: "#00BFFF", mb: 4, fontWeight: "bold" }}
        >
          Daily Usage (Doses)
        </Typography>
        <Box sx={{ height: 300, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{ backgroundColor: "#222", borderColor: "#444" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="co2"
                name="CO2 Doses"
                stroke="#00BFFF"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="flavor"
                name="Flavor Doses"
                stroke="#FF00FF"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Logs Tables */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          justifyContent: "center",
        }}
      >
        {/* Dispense Log Table */}
        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            p: 3,
            flex: 1,
            minWidth: 300,
            maxWidth: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#00BFFF", mb: 2, fontWeight: "bold" }}
          >
            Recent Dispenses
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Date/Time
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Size
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Sparkle
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Flavor
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData?.recent_dispenses?.map((log: any) => (
                  <TableRow
                    key={log.id}
                    hover
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell
                      sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                    >
                      {log.size_oz}oz
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                    >
                      {log.sparkle_level}
                    </TableCell>
                    <TableCell
                      sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                    >
                      {log.flavor_level}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>

        {/* CO2 Installation History */}
        <Card
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            borderRadius: 4,
            p: 3,
            flex: 1,
            minWidth: 300,
            maxWidth: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: "#00BFFF", mb: 2, fontWeight: "bold" }}
          >
            Tank Install History
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Installed
                  </TableCell>
                  <TableCell sx={{ color: "#aaa", fontWeight: "bold" }}>
                    Consumed
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData?.co2_history
                  ?.filter((t: any) => t.installed_at)
                  .map((tank: any) => (
                    <TableRow
                      key={tank.id}
                      hover
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell
                        sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                      >
                        {tank.id}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                      >
                        {tank.status}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                      >
                        {new Date(tank.installed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#fff", borderBottom: "1px solid #333" }}
                      >
                        {tank.consumed_at
                          ? new Date(tank.consumed_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export default DashboardPage;
