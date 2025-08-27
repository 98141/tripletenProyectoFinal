import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext, useMemo } from "react";

import apiUrl from "../../../api/apiClient";

import { AuthContext } from "../../../contexts/AuthContext";
import AdminOrderCommentBlock from "../../../blocks/admin/AdminOrderCommentBlock";
import { toast } from "react-toastify";
import { formatCOP } from "../../../utils/currency";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaSave,
  FaTimesCircle,
  FaUser,
  FaTruck,
  FaClipboardList,
} from "react-icons/fa";

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [fields, setFields] = useState({
    trackingNumber: "",
    shippingCompany: "",
    adminComment: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiUrl.get(`orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data);
        setFields({
          trackingNumber: res.data.trackingNumber || "",
          shippingCompany: res.data.shippingCompany || "",
          adminComment: res.data.adminComment || "",
        });
      } catch (err) {
        console.error(
          "Error cargando pedido:",
          err?.response?.data || err.message
        );
        toast.error("No se pudo cargar el pedido");
      }
    };
    fetchOrder();
  }, [id, token]);

  useEffect(() => {
    const fetchIds = async () => {
      try {
        const res = await apiUrl.get(`orders/ids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ids = res.data || [];
        setOrderIds(ids);
        const index = ids.findIndex((oid) => oid === id);
        setCurrentIndex(index);
      } catch (err) {
        console.error(
          "Error cargando IDs de pedidos:",
          err?.response?.data || err.message
        );
      }
    };
    fetchIds();
  }, [id, token]);

  const handleFieldChange = (field, value) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const hasChanges = useMemo(() => {
    if (!order) return false;
    return (
      fields.trackingNumber !== (order?.trackingNumber || "") ||
      fields.shippingCompany !== (order?.shippingCompany || "") ||
      fields.adminComment !== (order?.adminComment || "")
    );
  }, [fields, order]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const payload = {
        trackingNumber: fields.trackingNumber,
        shippingCompany: fields.shippingCompany,
        adminComment: fields.adminComment,
      };

      // Si tu backend devuelve { message, order }, rehidrata estado
      const { data } = await apiUrl.put(`orders/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const updated = data?.order || data;
      if (updated && updated._id) {
        setOrder(updated);
      }

      toast.success("Pedido actualizado con éxito");
      // Si prefieres volver al listado, deja la línea de abajo:
      // setTimeout(() => navigate("/admin"), 1200);
      setIsSaving(false);
    } catch (err) {
      console.error(
        "Error al guardar los cambios:",
        err?.response?.data || err.message
      );
      toast.error(err?.response?.data?.error || "Error al guardar los cambios");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  // ====== PDF (landscape) ======
  const exportSingleOrderToPDF = () => {
    if (!order) return;

    const HEAD_BG = [10, 102, 194];
    const HEAD_TX = [255, 255, 255];
    const GRID = [220, 226, 235];
    const ALT_ROW = [244, 248, 254];

    const doc = new jsPDF({ orientation: "landscape", unit: "mm" });

    doc.setFontSize(14);
    doc.text("Factura de Pedido", 14, 12);

    doc.setFontSize(10);
    doc.text(`ID del pedido: ${order._id}`, 14, 20);
    doc.text(`Usuario Nombre: ${order.user?.name || "N/A"}`, 14, 26);
    doc.text(`Usuario Correo: ${order.user?.email || "N/A"}`, 14, 32);
    doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`, 14, 38);
    doc.text(`Estado: ${order.status}`, 14, 44);

    // --- Datos de envío del cliente ---
    doc.setFontSize(11);
    doc.text("Datos de envío del cliente:", 14, 50);

    doc.setFontSize(10);
    doc.text(`Nombre: ${order?.shippingInfo?.fullName || "—"}`, 14, 56);
    doc.text(`Teléfono: ${order?.shippingInfo?.phone || "—"}`, 14, 62);
    doc.text(`Ciudad: ${order?.shippingInfo?.city || "—"}`, 14, 68);
    doc.text(`Dirección: ${order?.shippingInfo?.address || "—"}`, 14, 74);

    if (order?.shippingInfo?.notes) {
      const notes = String(order.shippingInfo.notes);
      doc.text("Notas:", 14, 80);
      doc.text(notes, 30, 80);
    }

    // --- Datos de envío del admin (guía/transportadora) ---
    let y = 92; // punto de partida para no solapar con los datos del cliente
    if (order.trackingNumber) {
      doc.text(`Guía: ${order.trackingNumber}`, 14, y);
      y += 6;
    }
    if (order.shippingCompany) {
      doc.text(`Transportadora: ${order.shippingCompany}`, 14, y);
      y += 6;
    }

    const columns = [
      { header: "Producto", dataKey: "product" },
      { header: "Variante", dataKey: "variant" },
      { header: "Cantidad", dataKey: "qty" },
      { header: "Precio", dataKey: "price" },
      { header: "Subtotal", dataKey: "subtotal" },
    ];

    const body = (order.items || []).map((item) => {
      const hasPrice = typeof item.product?.price === "number";
      const price = hasPrice ? item.product.price : 0;
      const qty = Number(item.quantity) || 0;
      const subtotal = qty * Number(price);

      return {
        product: item.product?.name || "Producto eliminado",
        variant: {
          size: item.size?.label || "-",
          color: item.color?.name || "-",
        },
        qty,
        price: hasPrice ? formatCOP(price) : "-",
        subtotal: hasPrice ? formatCOP(subtotal) : "-",
      };
    });

    autoTable(doc, {
      startY: y + 4,
      columns,
      body,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        lineColor: GRID,
        lineWidth: 0.2,
        valign: "middle",
      },
      headStyles: { fillColor: HEAD_BG, textColor: HEAD_TX, lineWidth: 0 },
      alternateRowStyles: { fillColor: ALT_ROW },
      columnStyles: {
        product: { cellWidth: 80 },
        variant: { cellWidth: 50 },
        qty: { halign: "right", cellWidth: 22 },
        price: { halign: "right", cellWidth: 30 },
        subtotal: { halign: "right", cellWidth: 32 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.dataKey === "variant")
          data.cell.text = [];
      },
      didDrawCell: (data) => {
        if (data.section !== "body" || data.column.dataKey !== "variant")
          return;
        const Doc = data.doc;
        const { x, y, width, height } = data.cell;
        const pad = 1.5;
        const ix = x + pad,
          iy = y + pad,
          iw = width - pad * 2,
          ih = height - pad * 2;
        const headerH = Math.min(6, ih * 0.35);
        const midX = ix + iw / 2;

        Doc.setDrawColor(GRID[0], GRID[1], GRID[2]);
        Doc.setLineWidth(0.2);
        Doc.rect(ix, iy, iw, ih);
        Doc.setFillColor(235, 240, 248);
        Doc.rect(ix, iy, iw, headerH, "F");
        Doc.setDrawColor(GRID[0], GRID[1], GRID[2]);
        Doc.line(midX, iy, midX, iy + ih);

        Doc.setTextColor(31, 45, 61);
        Doc.setFontSize(8.5);
        Doc.text("Talla", ix + 2, iy + headerH - 2);
        Doc.text("Color", midX + 2, iy + headerH - 2);

        const val = data.cell.raw || {};
        const valueY = iy + headerH + 4.5;
        Doc.setTextColor(55, 65, 81);
        Doc.setFontSize(9);
        Doc.text(String(val.size ?? "-"), ix + 2, valueY);
        Doc.text(String(val.color ?? "-"), midX + 2, valueY);
      },
    });

    const endY = doc.lastAutoTable?.finalY ?? y + 4;
    doc.setFontSize(11);
    doc.text(`Total: ${formatCOP(order.total ?? 0)}`, 14, endY + 8);

    if (order.adminComment) {
      doc.setFontSize(10);
      doc.text("Comentario del administrador:", 14, endY + 16);
      doc.text(order.adminComment, 14, endY + 22);
    }

    doc.save(`pedido_${order._id}.pdf`);
  };

  if (!order) return <p className="loading">Cargando detalles del pedido...</p>;

  const priceFmt = (n) => formatCOP(n);

  return (
    <div className="admin-order-detail">
      {/* Información del pedido */}
      <div className="section">
        <h3 className="section__title">
          <FaClipboardList className="icon" /> Información del pedido
        </h3>
        <p className="field">
          <strong>
            <FaUser className="icon" /> Usuario Email:
          </strong>{" "}
          {order.user?.email}
        </p>
        <p className="field">
          <strong>Usuario Nombre:</strong> {order.user?.name}
        </p>
        <p className="field">
          <strong>Estado actual:</strong> {order.status}
        </p>
      </div>

      <div className="actions-top">
        <button className="btn btn--ghost" onClick={exportSingleOrderToPDF}>
          Descargar PDF
        </button>
      </div>

      {/* Datos de envío del cliente */}
      <div className="section">
        <h3 className="section__title">
          <FaTruck className="icon" /> Datos de envío del cliente
        </h3>

        {order?.shippingInfo ? (
          <div className="shipping-info-grid">
            <p className="field">
              <strong>Nombre completo:</strong>{" "}
              {order.shippingInfo.fullName || "—"}
            </p>
            <p className="field">
              <strong>Teléfono:</strong> {order.shippingInfo.phone || "—"}
            </p>
            <p className="field">
              <strong>Ciudad:</strong> {order.shippingInfo.city || "—"}
            </p>
            <p className="field">
              <strong>Dirección:</strong> {order.shippingInfo.address || "—"}
            </p>
            <p className="field">
              <strong>Notas del cliente:</strong>{" "}
              {order.shippingInfo.notes || "—"}
            </p>
          </div>
        ) : (
          <em>El cliente no registró información de envío.</em>
        )}
      </div>

      {/* Productos del pedido */}
      <div className="section">
        <h3 className="section__title">
          <FaClipboardList className="icon" /> Productos del pedido
        </h3>

        <div className="table-responsive">
          <table className="table table-order-items">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Variante</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => {
                const hasPrice = typeof item.product?.price === "number";
                const price = hasPrice ? item.product.price : 0;
                const qty = Number(item.quantity) || 0;
                const subtotal = qty * Number(price);
                return (
                  <tr key={item._id || idx}>
                    <td>{item.product?.name || "Producto eliminado"}</td>
                    <td className="variant-cell">
                      <table className="variant-mini-table">
                        <thead>
                          <tr>
                            <th>Talla</th>
                            <th>Color</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{item.size?.label || "-"}</td>
                            <td>{item.color?.name || "-"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td>{qty}</td>
                    <td>{hasPrice ? priceFmt(price) : "-"}</td>
                    <td>{hasPrice ? priceFmt(subtotal) : "-"}</td>
                  </tr>
                );
              })}
              {(!order.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={5}>
                    <em>Sin ítems</em>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="total-label" colSpan={4}>
                  Total
                </td>
                <td className="total-value">{priceFmt(order.total ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Metadatos editables (admin) */}
      <div className="section">
        <h3 className="section__title">
          <FaTruck className="icon" /> Información de envío (admin)
        </h3>
        <AdminOrderCommentBlock
          comment={fields.adminComment}
          trackingNumber={fields.trackingNumber}
          shippingCompany={fields.shippingCompany}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Acciones */}
      <div className="section">
        <h3 className="section__title">💾 Acciones</h3>
        <div className="actions-row">
          <button
            onClick={handleSave}
            className={`btn btn--primary ${
              isSaving || !hasChanges ? "is-disabled" : ""
            }`}
            disabled={isSaving || !hasChanges}
            title="Guardar cambios en el pedido"
          >
            <FaSave className="icon" />
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            onClick={handleCancel}
            className="btn btn--muted"
            title="Cancelar cambios y volver"
          >
            <FaTimesCircle className="icon" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
