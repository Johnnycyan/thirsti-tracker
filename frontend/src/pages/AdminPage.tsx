import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Collapse,
  Chip,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { apiClient } from "../services/api";

export default function AdminPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<{
    co2_tanks: any[];
    flavor_pods: any[];
  }>({ co2_tanks: [], flavor_pods: [] });
  const [archivedPods, setArchivedPods] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [submissionCode, setSubmissionCode] = useState<string>("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [co2Quantity, setCo2Quantity] = useState("1");
  const [co2Cost, setCo2Cost] = useState("15");

  const [flavorOpen, setFlavorOpen] = useState(false);
  const [flavorQuantity, setFlavorQuantity] = useState("1");
  const [flavorCost, setFlavorCost] = useState("5");
  const [flavorName, setFlavorName] = useState("New Flavor");
  const [flavorColor, setFlavorColor] = useState("#ff0000");

  // Edit CO2 tank
  const [editTankOpen, setEditTankOpen] = useState(false);
  const [editingTank, setEditingTank] = useState<any>(null);

  // CO2 Refill dialog
  const [refillOpen, setRefillOpen] = useState(false);
  const [refillTankId, setRefillTankId] = useState<number | null>(null);
  const [refillCost, setRefillCost] = useState("15");

  // Edit Flavor pod
  const [editFlavorOpen, setEditFlavorOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<any>(null);

  // Edit log
  const [editLogOpen, setEditLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "log";
    id: number;
  } | null>(null);

  const [activeBaseColor, setActiveBaseColor] = useState<string | null>(null);

  const colorPalettes: Record<string, string[]> = {
    "#ff0000": [
      "#ffcccc",
      "#ff9999",
      "#ff6666",
      "#ff3333",
      "#ff0000",
      "#cc0000",
      "#990000",
    ],
    "#ff8c00": [
      "#ffe5cc",
      "#ffcc99",
      "#ffb266",
      "#ff9933",
      "#ff8c00",
      "#e67e00",
      "#cc7000",
    ],
    "#ffd700": [
      "#fff5cc",
      "#ffeb99",
      "#ffe066",
      "#ffd633",
      "#ffd700",
      "#e6c200",
      "#ccac00",
    ],
    "#32cd32": [
      "#d6f5d6",
      "#adebad",
      "#85e085",
      "#5cd65c",
      "#32cd32",
      "#2db82d",
      "#28a428",
    ],
    "#00bfff": [
      "#cceeff",
      "#99ddff",
      "#66ccff",
      "#33bbff",
      "#00bfff",
      "#00ace6",
      "#0099cc",
    ],
    "#ff00ff": [
      "#ffccff",
      "#ff99ff",
      "#ff66ff",
      "#ff33ff",
      "#ff00ff",
      "#e600e6",
      "#cc00cc",
    ],
    "#8a2be2": [
      "#e8d4f9",
      "#d1a9f3",
      "#ba7eed",
      "#a353e7",
      "#8a2be2",
      "#7c27cb",
      "#6e22b5",
    ],
  };

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get<any>("/api/admin/inventory");
      setInventory(res);
    } catch (err: any) {
      if (err?.message?.includes("401")) navigate("/login");
    }
  };

  const fetchArchive = async () => {
    try {
      const res = await apiClient.get<any>("/api/admin/flavor/archive");
      setArchivedPods(res.archived_pods || []);
    } catch {}
  };

  const fetchAdminLogs = async () => {
    try {
      const res = await apiClient.get<any>("/api/admin/logs");
      setAdminLogs(res.logs || []);
    } catch {}
  };

  const fetchCode = async () => {
    try {
      const res = await apiClient.get<any>("/api/admin/code");
      setSubmissionCode(res.code);
    } catch {}
  };

  useEffect(() => {
    // Check auth on mount
    if (!apiClient.getToken()) {
      navigate("/login");
      return;
    }
    fetchInventory();
    fetchArchive();
    fetchAdminLogs();
    fetchCode();
  }, []);

  const handleGenerateCode = async () => {
    try {
      const res = await apiClient.post<any>("/api/admin/code", {});
      setSubmissionCode(res.code);
    } catch {
      alert("Failed to generate code");
    }
  };

  const handlePurchaseCO2 = async () => {
    try {
      await apiClient.post("/api/admin/co2/purchase", {
        quantity: parseInt(co2Quantity),
        cost: parseFloat(co2Cost),
      });
      fetchInventory();
    } catch {
      alert("Failed to purchase CO2");
    }
  };

  const handleInstallCO2 = async () => {
    try {
      await apiClient.post("/api/admin/co2/install", {});
      fetchInventory();
    } catch {
      alert("Failed to install CO2 (make sure you have an extra full one)");
    }
  };

  const handleDeleteCO2 = async (id: number) => {
    try {
      await apiClient.delete(`/api/admin/co2/${id}`);
      fetchInventory();
    } catch {
      alert("Failed to delete tank");
    }
  };

  const saveEditedTank = async () => {
    if (!editingTank) return;
    try {
      await apiClient.put(`/api/admin/co2/${editingTank.id}`, {
        status: editingTank.status,
        doses_used: parseInt(editingTank.doses_used),
      });
      setEditTankOpen(false);
      fetchInventory();
    } catch {
      alert("Failed to edit tank");
    }
  };

  const openRefillDialog = (tankId: number) => {
    setRefillTankId(tankId);
    setRefillCost("15");
    setRefillOpen(true);
  };

  const handleRefillCO2 = async () => {
    if (!refillTankId) return;
    try {
      await apiClient.post(`/api/admin/co2/${refillTankId}/refill`, {
        cost: parseFloat(refillCost),
      });
      setRefillOpen(false);
      fetchInventory();
    } catch {
      alert("Failed to refill CO2 tank");
    }
  };

  const handlePurchaseFlavor = async () => {
    try {
      await apiClient.post("/api/admin/flavor/purchase", {
        quantity: parseInt(flavorQuantity),
        cost: parseFloat(flavorCost),
        name: flavorName,
        color_hex: flavorColor,
      });
      setFlavorOpen(false);
      fetchInventory();
    } catch {
      alert("Failed to purchase Flavor Pod");
    }
  };

  const handleInstallFlavor = async (id: number) => {
    try {
      await apiClient.post(`/api/admin/flavor/install/${id}`, {});
      fetchInventory();
      fetchArchive();
    } catch {
      alert("Failed to install flavor pod");
    }
  };

  const handleDeleteFlavor = async (id: number) => {
    try {
      await apiClient.delete(`/api/admin/flavor/${id}`);
      fetchInventory();
    } catch {
      alert("Failed to delete flavor");
    }
  };

  const saveEditedFlavor = async () => {
    if (!editingFlavor) return;
    try {
      await apiClient.put(`/api/admin/flavor/${editingFlavor.id}`, {
        name: editingFlavor.name,
        color_hex: editingFlavor.color_hex,
        status: editingFlavor.status,
        doses_used: parseInt(editingFlavor.doses_used),
      });
      setEditFlavorOpen(false);
      fetchInventory();
      fetchArchive(); // refresh archive if pod was set to consumed
    } catch {
      alert("Failed to edit flavor");
    }
  };

  const handleUnarchiveFlavor = async (id: number) => {
    try {
      await apiClient.put(`/api/admin/flavor/${id}`, {
        ...(archivedPods.find((p) => p.id === id) || {}),
        status: "extra",
      });
      fetchInventory();
      fetchArchive();
    } catch {
      alert("Failed to unarchive flavor pod");
    }
  };

  const saveEditedLog = async () => {
    if (!editingLog) return;
    try {
      await apiClient.put(`/api/admin/log/${editingLog.id}`, {
        sparkle_level: parseInt(editingLog.sparkle_level),
        flavor_level: parseInt(editingLog.flavor_level),
        size_oz: parseInt(editingLog.size_oz),
        co2_doses: parseInt(editingLog.co2_doses),
        flavor_doses: parseInt(editingLog.flavor_doses),
      });
      setEditLogOpen(false);
      fetchAdminLogs();
    } catch {
      alert("Failed to edit log");
    }
  };

  const requestDeleteLog = (id: number) => {
    setDeleteTarget({ type: "log", id });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "log") {
        await apiClient.delete(`/api/admin/log/${deleteTarget.id}`);
        fetchAdminLogs();
      }
    } catch {
      alert("Failed to delete");
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const fmt$ = (v: number) => `$${v.toFixed(2)}`;

  const statusColor: Record<string, string> = {
    extra_full: "#4caf50",
    extra_empty: "#f44336",
    installed: "#00bfff",
    consumed: "#888",
    extra: "#4caf50",
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 4, color: "#00BFFF", fontWeight: "bold" }}
      >
        Admin Panel
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {/* Left Col: Actions */}
        <Box
          sx={{
            flex: 1,
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Submission Code */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff" }}>
                Submission Code
              </Typography>
              <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
                Required on the public <code>/dispense</code> page.
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography
                  variant="h5"
                  sx={{
                    flexGrow: 1,
                    p: 1,
                    bgcolor: "#000",
                    textAlign: "center",
                    borderRadius: 1,
                    color: "#00BFFF",
                    fontWeight: "bold",
                  }}
                >
                  {submissionCode || "---"}
                </Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
                  onClick={handleGenerateCode}
                >
                  Generate New
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* CO2 Actions */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                CO2 Tanks
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={co2Quantity}
                  onChange={(e) => setCo2Quantity(e.target.value)}
                  size="small"
                  sx={{ width: 100 }}
                />
                <TextField
                  label="Total Cost ($)"
                  type="number"
                  value={co2Cost}
                  onChange={(e) => setCo2Cost(e.target.value)}
                  size="small"
                  sx={{ width: 130 }}
                />
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
                  onClick={handlePurchaseCO2}
                >
                  Add
                </Button>
              </Box>
              <Divider sx={{ my: 2, borderColor: "#333" }} />
              <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
                Install an extra full tank. Moves current tank to empty stock.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleInstallCO2}
              >
                Install Next CO2 Tank
              </Button>
            </CardContent>
          </Card>

          {/* Flavor Actions */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                Flavor Pods
              </Typography>
              <Button
                variant="contained"
                sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
                onClick={() => setFlavorOpen(true)}
              >
                Add Flavor Pods
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Right Col: Inventory Tables */}
        <Box
          sx={{
            flex: 2,
            minWidth: 320,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* Flavor Pod Inventory */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                Flavor Pod Inventory
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Name
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Doses
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Cost
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.flavor_pods.map((pod) => (
                      <TableRow key={pod.id}>
                        <TableCell sx={{ color: "#fff" }}>{pod.id}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                bgcolor: pod.color_hex,
                                flexShrink: 0,
                              }}
                            />
                            {pod.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pod.status}
                            size="small"
                            sx={{
                              bgcolor: statusColor[pod.status] || "#555",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {pod.doses_used}
                        </TableCell>
                        <TableCell sx={{ color: "#aaa" }}>
                          {fmt$(pod.cost || 0)}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {pod.status === "extra" && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleInstallFlavor(pod.id)}
                              >
                                Install
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingFlavor({ ...pod });
                                setEditFlavorOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteFlavor(pod.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.flavor_pods.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          sx={{ color: "#555", textAlign: "center", py: 3 }}
                        >
                          No active flavor pods
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>

              {/* Archived Pods */}
              <Box sx={{ mt: 2 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setArchiveOpen(!archiveOpen)}
                  endIcon={
                    archiveOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  }
                  sx={{ color: "#888" }}
                >
                  Archived Pods ({archivedPods.length})
                </Button>
                <Collapse in={archiveOpen}>
                  <Box sx={{ overflowX: "auto", mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            ID
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            Name
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            Doses Used
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            Cost
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            Consumed
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#666",
                              fontSize: "0.75rem",
                              bgcolor: "#1E1E1E",
                            }}
                          >
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {archivedPods.map((pod) => (
                          <TableRow key={pod.id} sx={{ opacity: 0.7 }}>
                            <TableCell
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              {pod.id}
                            </TableCell>
                            <TableCell
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: pod.color_hex,
                                  }}
                                />
                                {pod.name}
                              </Box>
                            </TableCell>
                            <TableCell
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              {pod.doses_used}
                            </TableCell>
                            <TableCell
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              {fmt$(pod.cost || 0)}
                            </TableCell>
                            <TableCell
                              sx={{ color: "#aaa", fontSize: "0.75rem" }}
                            >
                              {pod.consumed_at
                                ? new Date(pod.consumed_at).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.75rem" }}>
                              <Button
                                size="small"
                                variant="text"
                                sx={{
                                  color: "#4caf50",
                                  fontSize: "0.7rem",
                                  py: 0.25,
                                }}
                                onClick={() => handleUnarchiveFlavor(pod.id)}
                              >
                                Unarchive
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {archivedPods.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              sx={{
                                color: "#555",
                                textAlign: "center",
                                py: 2,
                                fontSize: "0.75rem",
                              }}
                            >
                              No archived pods
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Collapse>
              </Box>
            </CardContent>
          </Card>

          {/* CO2 Tank Inventory */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                CO2 Tank Inventory
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Doses
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Cost
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.co2_tanks.map((tank) => (
                      <TableRow key={tank.id}>
                        <TableCell sx={{ color: "#fff" }}>{tank.id}</TableCell>
                        <TableCell>
                          <Chip
                            label={tank.status}
                            size="small"
                            sx={{
                              bgcolor: statusColor[tank.status] || "#555",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {tank.doses_used}
                        </TableCell>
                        <TableCell sx={{ color: "#aaa" }}>
                          {fmt$(tank.cost || 0)}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {tank.status === "installed" && (
                              <Tooltip title="Refill Tank">
                                <IconButton
                                  size="small"
                                  sx={{ color: "#4caf50" }}
                                  onClick={() => openRefillDialog(tank.id)}
                                >
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingTank({ ...tank });
                                setEditTankOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCO2(tank.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.co2_tanks.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          sx={{ color: "#555", textAlign: "center", py: 3 }}
                        >
                          No CO2 tanks
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>

          {/* Usage History */}
          <Card sx={{ bgcolor: "#1E1E1E" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                Usage History
              </Typography>
              <Box sx={{ overflowX: "auto", maxHeight: 400, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Date / Time
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Size
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Sparkle
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Flavor
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        CO2 Doses
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Flavor Doses
                      </TableCell>
                      <TableCell sx={{ color: "#aaa", bgcolor: "#1E1E1E" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminLogs.map((log) => (
                      <TableRow key={log.id} hover>
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
                        <TableCell
                          sx={{
                            color: "#00BFFF",
                            borderBottom: "1px solid #333",
                          }}
                        >
                          {log.co2_doses}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#FF00FF",
                            borderBottom: "1px solid #333",
                          }}
                        >
                          {log.flavor_doses}
                        </TableCell>
                        <TableCell sx={{ borderBottom: "1px solid #333" }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingLog({ ...log });
                                setEditLogOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => requestDeleteLog(log.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {adminLogs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          sx={{ color: "#555", textAlign: "center", py: 3 }}
                        >
                          No usage history
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* ── Dialogs ── */}

      {/* Flavor Purchase Dialog */}
      <Dialog
        open={flavorOpen}
        onClose={() => setFlavorOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Add Flavor Pods</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Flavor Name"
            value={flavorName}
            onChange={(e) => setFlavorName(e.target.value)}
            InputLabelProps={{ sx: { bgcolor: "#1a1a1a", px: 1 } }}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Color Hex (e.g. #ff0000)"
            value={flavorColor}
            onChange={(e) => setFlavorColor(e.target.value)}
            InputLabelProps={{ sx: { bgcolor: "#1a1a1a", px: 1 } }}
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            {Object.keys(colorPalettes).map((baseColor) => (
              <Box
                key={baseColor}
                onClick={() => {
                  setFlavorColor(baseColor);
                  setActiveBaseColor(baseColor);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: baseColor,
                  cursor: "pointer",
                  border:
                    flavorColor === baseColor || activeBaseColor === baseColor
                      ? "2px solid white"
                      : "none",
                }}
              />
            ))}
          </Box>
          {activeBaseColor && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 1,
                p: 1,
                bgcolor: "#222",
                borderRadius: 2,
              }}
            >
              {colorPalettes[activeBaseColor].map((shade) => (
                <Box
                  key={shade}
                  onClick={() => setFlavorColor(shade)}
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: shade,
                    cursor: "pointer",
                    border: flavorColor === shade ? "2px solid white" : "none",
                  }}
                />
              ))}
            </Box>
          )}
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={flavorQuantity}
              onChange={(e) => setFlavorQuantity(e.target.value)}
            />
            <TextField
              label="Total Cost ($)"
              type="number"
              value={flavorCost}
              onChange={(e) => setFlavorCost(e.target.value)}
            />
          </Box>
          {parseFloat(flavorCost) > 0 && parseInt(flavorQuantity) > 0 && (
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Each pod:{" "}
              {fmt$(parseFloat(flavorCost) / parseInt(flavorQuantity))}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlavorOpen(false)}>Cancel</Button>
          <Button onClick={handlePurchaseFlavor} variant="contained">
            Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* CO2 Refill Dialog */}
      <Dialog
        open={refillOpen}
        onClose={() => setRefillOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Refill CO2 Tank #{refillTankId}</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 280,
          }}
        >
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            Current doses used will be saved to history, then reset to 0.
          </Typography>
          <TextField
            label="Refill Cost ($)"
            type="number"
            value={refillCost}
            onChange={(e) => setRefillCost(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefillOpen(false)}>Cancel</Button>
          <Button onClick={handleRefillCO2} variant="contained" color="success">
            Confirm Refill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit CO2 Dialog */}
      <Dialog
        open={editTankOpen}
        onClose={() => setEditTankOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Edit CO2 Tank</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 300,
          }}
        >
          {editingTank && (
            <>
              <TextField
                label="Doses Used"
                type="number"
                value={editingTank.doses_used}
                onChange={(e) =>
                  setEditingTank({ ...editingTank, doses_used: e.target.value })
                }
              />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingTank.status}
                  label="Status"
                  onChange={(e) =>
                    setEditingTank({ ...editingTank, status: e.target.value })
                  }
                >
                  <MenuItem value="extra_full">Extra Full</MenuItem>
                  <MenuItem value="extra_empty">Extra Empty</MenuItem>
                  <MenuItem value="installed">Installed</MenuItem>
                  <MenuItem value="consumed">Consumed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTankOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedTank} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Flavor Dialog */}
      <Dialog
        open={editFlavorOpen}
        onClose={() => setEditFlavorOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Edit Flavor Pod</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 300,
          }}
        >
          {editingFlavor && (
            <>
              <TextField
                label="Flavor Name"
                value={editingFlavor.name}
                onChange={(e) =>
                  setEditingFlavor({ ...editingFlavor, name: e.target.value })
                }
              />
              <TextField
                label="Color Hex"
                value={editingFlavor.color_hex}
                onChange={(e) =>
                  setEditingFlavor({
                    ...editingFlavor,
                    color_hex: e.target.value,
                  })
                }
              />
              <TextField
                label="Doses Used"
                type="number"
                value={editingFlavor.doses_used}
                onChange={(e) =>
                  setEditingFlavor({
                    ...editingFlavor,
                    doses_used: e.target.value,
                  })
                }
              />
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editingFlavor.status}
                  label="Status"
                  onChange={(e) =>
                    setEditingFlavor({
                      ...editingFlavor,
                      status: e.target.value,
                    })
                  }
                >
                  <MenuItem value="extra">Extra</MenuItem>
                  <MenuItem value="installed">Installed</MenuItem>
                  <MenuItem value="consumed">Consumed</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditFlavorOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedFlavor} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Log Dialog */}
      <Dialog
        open={editLogOpen}
        onClose={() => setEditLogOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Edit Usage Log</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 300,
          }}
        >
          {editingLog && (
            <>
              <Typography variant="caption" sx={{ color: "#aaa" }}>
                {new Date(editingLog.created_at).toLocaleString()}
              </Typography>
              <FormControl>
                <InputLabel>Size (oz)</InputLabel>
                <Select
                  value={editingLog.size_oz}
                  label="Size (oz)"
                  onChange={(e) =>
                    setEditingLog({ ...editingLog, size_oz: e.target.value })
                  }
                >
                  {[6, 12, 18, 24].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}oz
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Sparkle Level</InputLabel>
                <Select
                  value={editingLog.sparkle_level}
                  label="Sparkle Level"
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      sparkle_level: e.target.value,
                    })
                  }
                >
                  {[0, 1, 2, 3].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Flavor Level</InputLabel>
                <Select
                  value={editingLog.flavor_level}
                  label="Flavor Level"
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      flavor_level: e.target.value,
                    })
                  }
                >
                  {[0, 1, 2].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="CO2 Doses"
                type="number"
                value={editingLog.co2_doses}
                onChange={(e) =>
                  setEditingLog({ ...editingLog, co2_doses: e.target.value })
                }
              />
              <TextField
                label="Flavor Doses"
                type="number"
                value={editingLog.flavor_doses}
                onChange={(e) =>
                  setEditingLog({ ...editingLog, flavor_doses: e.target.value })
                }
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLogOpen(false)}>Cancel</Button>
          <Button onClick={saveEditedLog} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { bgcolor: "#1a1a1a", color: "#fff" } }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
