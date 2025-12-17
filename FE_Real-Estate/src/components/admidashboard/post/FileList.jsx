import React, { useMemo } from "react";
import { Stack, Card, CardContent, Typography, Button, Chip } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

const getExt = (url = "") => {
    const clean = url.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    return (parts[parts.length - 1] || "").toLowerCase();
};

const pickIcon = (mime = "", url = "") => {
    const ext = getExt(url);
    const m = (mime || "").toLowerCase();

    if (m.includes("pdf") || ext === "pdf") return PictureAsPdfOutlinedIcon;
    if (m.includes("word") || ["doc", "docx"].includes(ext)) return DescriptionOutlinedIcon;
    if (m.includes("excel") || ["xls", "xlsx", "csv"].includes(ext)) return TableChartOutlinedIcon;

    return InsertDriveFileOutlinedIcon;
};

const guessName = (url = "") => {
    const clean = url.split("?")[0].split("#")[0];
    try {
        const last = clean.split("/").pop();
        return decodeURIComponent(last || "file");
    } catch {
        return clean.split("/").pop() || "file";
    }
};

const mimeLabel = (mime = "", url = "") => {
    const ext = getExt(url);
    if (!mime && ext) return ext.toUpperCase();
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("word")) return "DOC";
    if (mime.includes("excel")) return "XLS";
    return ext ? ext.toUpperCase() : "FILE";
};

export default function FileList({ files = [] }) {
    const list = useMemo(() => {
        return (files || [])
            .map((f) => {
                if (!f) return null;
                if (typeof f === "string") {
                    return { url: f, mimeType: "", name: guessName(f) };
                }
                return {
                    url: f.url || f.imageUrl || f.fileUrl || "",
                    mimeType: f.mimeType || f.type || "",
                    name: f.name || f.originalName || guessName(f.url || f.imageUrl || f.fileUrl || ""),
                };
            })
            .filter((x) => x && x.url);
    }, [files]);

    if (!list.length) return null;

    return (
        <Stack spacing={1.2}>
            {list.map((f, idx) => {
                const Icon = pickIcon(f.mimeType, f.url);
                return (
                    <Card key={idx} variant="outlined" sx={{ borderRadius: 2.5, borderColor: "#e6edf7" }}>
                        <CardContent sx={{ py: 1.2, "&:last-child": { pb: 1.2 } }}>
                            <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                                    <Icon sx={{ fontSize: 22, color: "#64748b" }} />

                                    <Stack sx={{ minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 900 }} noWrap title={f.name}>
                                            {f.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                size="small"
                                                label={mimeLabel((f.mimeType || "").toLowerCase(), f.url)}
                                                sx={{ height: 20, fontWeight: 900, bgcolor: "rgba(15,23,42,0.04)", border: "1px solid #e6edf7" }}
                                            />
                                            <Typography sx={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }} noWrap title={f.url}>
                                                {f.url}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<OpenInNewIcon />}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, borderColor: "#e6edf7" }}
                                        onClick={() => window.open(f.url, "_blank")}
                                    >
                                        Mở
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<DownloadOutlinedIcon />}
                                        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 900, borderColor: "#e6edf7" }}
                                        component="a"
                                        href={f.url}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Tải
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                );
            })}
        </Stack>
    );
}
