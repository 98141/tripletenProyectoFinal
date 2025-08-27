import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";

import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";
import { SupportContext } from "../contexts/SupportContext";
import { useToast } from "../contexts/ToastContext";
import ConfirmModal from "../blocks/ConfirmModalBlock";

/* ==================== Helpers de "ruta activa" ==================== */
const isMatch = (pathname, matcher) => {
  if (!matcher) return false;
  if (matcher instanceof RegExp) return matcher.test(pathname);
  if (typeof matcher === "string") {
    if (matcher === "/") return pathname === "/";
    return pathname === matcher || pathname.startsWith(matcher + "/");
  }
  if (Array.isArray(matcher)) return matcher.some((m) => isMatch(pathname, m));
  return false;
};
/* ================================================================= */

/** ===================== MENÚ CONFIG ===================== */
const menuConfig = ({ role, hidePublic }) => {
  const publicGroup = hidePublic
    ? []
    : [
        { label: "Inicio", to: "/", activeMatch: /^\/$/ },
        {
            label: "Artesanías",
            to: "/artesanias",
            activeMatch: /^\/artesanias(\/|$)/,
            children: [
              {
                label: "Hogar",
                to: "/categoria/hogar",
                activeMatch: /^\/categoria\/hogar(\/|$)/,
              },
              {
                label: "Carteras",
                to: "/categoria/carteras",
                activeMatch: /^\/categoria\/carteras(\/|$)/,
              },
              {
                label: "Sombreros",
                to: "/categoria/sombreros",
                activeMatch: /^\/categoria\/sombreros(\/|$)/,
              },
              {
                label: "Manualidades",
                to: "/categoria/manualidades",
                activeMatch: /^\/categoria\/manualidades(\/|$)/,
              },
              {
                label: "Letras",
                to: "/categoria/letras",
                activeMatch: /^\/categoria\/letras(\/|$)/,
              },
              {
                label: "Aretes",
                to: "/categoria/aretes",
                activeMatch: /^\/categoria\/aretes(\/|$)/,
              },
            ],
          },
        {
          label: "Café",
          to: "/cafe",
          activeMatch: /^\/cafe(\/|$)/,
          children: [
            {
              label: "Origen Nariño",
              to: "/cafe/narino",
              activeMatch: /^\/cafe\/narino(\/|$)/,
            },
            {
              label: "Tostiones",
              to: "/cafe/tostiones",
              activeMatch: /^\/cafe\/tostiones(\/|$)/,
            },
            {
              label: "Métodos",
              to: "/cafe/metodos",
              activeMatch: /^\/cafe\/metodos(\/|$)/,
            },
          ],
        },
        {
          label: "Panela",
          to: "/panela",
          activeMatch: /^\/panela(\/|$)/,
          children: [
            {
              label: "Trapiche",
              to: "/panela/tradicion",
              activeMatch: /^\/panela\/tradicion(\/|$)/,
            },
            {
              label: "Presentaciones",
              to: "/panela/presentaciones",
              activeMatch: /^\/panela\/presentaciones(\/|$)/,
            },
            {
              label: "Recetas",
              to: "/panela/recetas",
              activeMatch: /^\/panela\/recetas(\/|$)/,
            },
          ],
        },
      ];

  const userOnly =
    role === "user"
      ? [
          { label: "Inicio", to: "/", activeMatch: /^\/$/ },
          {
            label: "Artesanías",
            to: "/artesanias",
            activeMatch: /^\/artesanias(\/|$)/,
            children: [
              {
                label: "Hogar",
                to: "/categoria/hogar",
                activeMatch: /^\/categoria\/hogar(\/|$)/,
              },
              {
                label: "Carteras",
                to: "/categoria/carteras",
                activeMatch: /^\/categoria\/carteras(\/|$)/,
              },
              {
                label: "Sombreros",
                to: "/categoria/sombreros",
                activeMatch: /^\/categoria\/sombreros(\/|$)/,
              },
              {
                label: "Manualidades",
                to: "/categoria/manualidades",
                activeMatch: /^\/categoria\/manualidades(\/|$)/,
              },
              {
                label: "Letras",
                to: "/categoria/letras",
                activeMatch: /^\/categoria\/letras(\/|$)/,
              },
              {
                label: "Aretes",
                to: "/categoria/aretes",
                activeMatch: /^\/categoria\/aretes(\/|$)/,
              },
            ],
          },
          {
            label: "Café",
            to: "/cafe",
            activeMatch: /^\/cafe(\/|$)/,
            children: [
              {
                label: "Origen Nariño",
                to: "/",
                activeMatch: /^\/cafe\/narino(\/|$)/,
              },
              {
                label: "Tostiones",
                to: "/",
                activeMatch: /^\/cafe\/tostiones(\/|$)/,
              },
              {
                label: "Métodos",
                to: "/",
                activeMatch: /^\/cafe\/metodos(\/|$)/,
              },
            ],
          },
          {
            label: "Panela",
            to: "/panela",
            activeMatch: /^\/panela(\/|$)/,
            children: [
              {
                label: "Trapiche",
                to: "/",
                activeMatch: /^\/panela\/tradicion(\/|$)/,
              },
              {
                label: "Presentaciones",
                to: "/",
                activeMatch: /^\/panela\/presentaciones(\/|$)/,
              },
              {
                label: "Recetas",
                to: "/",
                activeMatch: /^\/panela\/recetas(\/|$)/,
              },
            ],
          },
          {
            label: "Mis pedidos",
            to: "/my-orders",
            activeMatch: /^\/my-orders(\/|$)/,
          },
        ]
      : [];

  const adminOnly =
    role === "admin"
      ? [
          {
            label: "Dashboard",
            to: "/admin/dashboard",
            activeMatch: /^\/admin\/dashboard(\/|$)/,
          },
          { label: "Pedidos", to: "/admin", activeMatch: /^\/admin\/?$/ },
          {
            label: "Historial",
            to: "/admin/orders",
            activeMatch: /^\/admin\/orders(\/|$)/,
          },
          {
            label: "Productos",
            to: "/admin/products",
            activeMatch: /^\/admin\/products(\/|$)/,
            children: [
              {
                label: "Ver productos",
                to: "/admin/products",
                activeMatch: /^\/admin\/products(\/|$)/,
              },
              {
                label: "Agregar producto",
                to: "/admin/products/new",
                activeMatch: /^\/admin\/products\/new(\/|$)/,
              },
              {
                label: "Categorias",
                to: "/admin/categories",
                activeMatch: /^\/admin\/categories(\/|$)/,
              },
              {
                label: "Tallas",
                to: "/admin/sizes",
                activeMatch: /^\/admin\/sizes(\/|$)/,
              },
              {
                label: "Colores",
                to: "/admin/colors",
                activeMatch: /^\/admin\/colors(\/|$)/,
              },
              {
                label: "Historial",
                to: "/admin/historial",
                activeMatch: /^\/admin\/history(\/|$)/,
              },
            ],
          },
        ]
      : [];

  if (role === "admin") return adminOnly;
  if (role === "user") return userOnly;
  return publicGroup;
};
/** ======================================================= */

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const { unreadCount } = useContext(SupportContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showConfirm, setShowConfirm] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileOpenIndex, setMobileOpenIndex] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const navRef = useRef(null);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const hidePublic = isAdminRoute || Boolean(user);
  const isCustomer = user?.role === "user";

  const capitalizeInitials = (name) =>
    (name || "")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  useEffect(() => {
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setDrawerOpen(false);
        setMobileOpenIndex(null);
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const items = menuConfig({ role: user?.role, hidePublic });

  const goSupportPath = user
    ? user.role === "admin"
      ? "/admin/inbox"
      : "/support"
    : "/login";

  const isSupportActive =
    isMatch(location.pathname, /^\/support(\/|$)/) ||
    isMatch(location.pathname, /^\/admin\/inbox(\/|$)/);

  const handleLogoutConfirm = async () => {
    await logout();
    showToast("Sesión cerrada correctamente", "success");
    navigate("/");
  };

  const handleSearchToggle = () => setShowSearch((s) => !s);
  const handleWishlist = () =>
    showToast("Favoritos estará disponible pronto.", "info");
  const accountPath = !user
    ? "/login"
    : user.role === "admin"
    ? "/admin/dashboard"
    : "/";

  return (
    <>
      <nav className="navbar-container" ref={navRef}>
        <div className="navbar-wrapper">
          {/* IZQUIERDA: LOGO */}
          <div className="nav-left">
            <Link
              to={
                user ? (user.role === "admin" ? "/admin/dashboard" : "/") : "/"
              }
              className="brand"
            >
              <span className="brand-name">Artesanías Paja Toquilla</span>
            </Link>
          </div>

          {/* CENTRO: MENÚ */}
          <div className="nav-center">
            <ul
              className="menu-root"
              role="menubar"
              aria-label="Menú principal"
            >
              {items.map((item, idx) => {
                const hasChildren =
                  Array.isArray(item.children) && item.children.length > 0;
                const parentActive =
                  isMatch(location.pathname, item.activeMatch || item.to) ||
                  (hasChildren &&
                    item.children.some((c) =>
                      isMatch(location.pathname, c.activeMatch || c.to)
                    ));

                return (
                  <li
                    key={`${item.to || item.label || "item"}-${idx}`}
                    className={`menu-item ${
                      openDropdown === idx ? "open" : ""
                    }`}
                    onMouseEnter={() => {
                      if (window.innerWidth >= 1024 && hasChildren)
                        setOpenDropdown(idx);
                    }}
                  >
                    <button
                      className={`menu-top ${parentActive ? "active" : ""}`}
                      aria-haspopup={hasChildren ? "true" : "false"}
                      aria-expanded={openDropdown === idx}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!hasChildren) {
                          navigate(item.to);
                          return;
                        }
                        setOpenDropdown((cur) => (cur === idx ? null : idx));
                      }}
                    >
                      {item.label}
                      {hasChildren && (
                        <span className="chev" aria-hidden>
                          ▾
                        </span>
                      )}
                    </button>

                    {hasChildren && (
                      <div
                        className="dropdown"
                        role="menu"
                        aria-label={`Submenú de ${item.label}`}
                        aria-hidden={openDropdown !== idx}
                      >
                        {item.children.map((child, cIdx) => {
                          const childActive = isMatch(
                            location.pathname,
                            child.activeMatch || child.to
                          );
                          return (
                            <Link
                              key={`${item.to || "root"}::${
                                child.to || child.label
                              }::${cIdx}`}
                              className={`dropdown-link ${
                                childActive ? "active" : ""
                              }`}
                              to={child.to}
                              onClick={() => setOpenDropdown(null)}
                              role="menuitem"
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* DERECHA */}
          <div className="nav-right">
            {/* Iconos (solo desktop) — SOLO para clientes */}
            {isCustomer && (
              <div className="icon-bar">
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSearchToggle();
                  }}
                  className={`icon-btn ${showSearch ? "active" : ""}`}
                  aria-label="Buscar"
                  title="Buscar"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21l1-1-5.5-5.5zM5 10.5A5.5 5.5 0 1 1 10.5 16 5.51 5.51 0 0 1 5 10.5z" />
                  </svg>
                </Link>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleWishlist();
                  }}
                  className="icon-btn cart-btn"
                  aria-label="Favoritos"
                  title="Favoritos"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.8 4.6c-1.9-1.7-4.9-1.7-6.8 0l-1 1-1-1c-1.9-1.7-4.9-1.7-6.8 0s-1.9 4.5 0 6.2l7.8 7.2 7.8-7.2c1.9-1.7 1.9-4.5 0-6.2z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="cart-badge">{totalItems}</span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className="icon-btn cart-btn"
                  aria-label="Carrito"
                  title="Carrito"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 4h-2l-1 2v2h2l3.6 7.59L8.24 18H19v-2H9.42l1.1-2h6.45a2 2 0 0 0 1.79-1.11L21 7H6.21l-.94-2H3" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="cart-badge">{totalItems}</span>
                  )}
                </Link>
              </div>
            )}

            {/* Perfil */}

            {/* Soporte + usuario */}
            {user && (
              <>
                <Link
                  to={accountPath}
                  className={`icon-btn support-link ${
                    isSupportActive ? "active" : ""
                  }`}
                  aria-label="Perfil"
                  title="Perfil"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                  </svg>
                </Link>
                <Link
                  to={goSupportPath}
                  className={`nav-link support-link ${
                    isSupportActive ? "active" : ""
                  }`}
                >
                  Soporte
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </Link>
              </>
            )}

            {user ? (
              <div className="user-box">
                <div className="user-avatar" aria-hidden>
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <span className="nav-user">
                  Hola, {capitalizeInitials(user.name)}
                </span>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="logout-button"
                  type="button"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link
                  to="/login"
                  className={
                    isMatch(location.pathname, /^\/login(\/|$)/)
                      ? "nav-link active"
                      : "nav-link"
                  }
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={
                    isMatch(location.pathname, /^\/register(\/|$)/)
                      ? "nav-link active"
                      : "nav-link"
                  }
                >
                  Registro
                </Link>
              </div>
            )}

            {/* Hamburguesa (móvil) */}
            <button
              className={`burger ${drawerOpen ? "active" : ""}`}
              onClick={() => {
                setDrawerOpen((s) => !s);
                setMobileOpenIndex(null);
                setShowSearch(false);
              }}
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Búsqueda desplegable (desktop/tablet) — solo cliente */}
        {isCustomer && (
          <div
            className={`search-bar ${showSearch ? "open" : ""}`}
            role="region"
            aria-hidden={!showSearch}
          >
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.currentTarget.elements.q.value.trim();
                if (!q) return;
                setShowSearch(false);
                navigate(`/tienda?q=${encodeURIComponent(q)}`);
              }}
            >
              <input
                name="q"
                type="search"
                placeholder="Busca productos, colecciones…"
                aria-label="Buscar"
              />
              <button type="submit" className="btn-search">
                Buscar
              </button>
            </form>
          </div>
        )}

        {/* Drawer móvil */}
        <aside
          className={`drawer ${drawerOpen ? "open" : ""}`}
          aria-hidden={!drawerOpen}
        >
          <div className="drawer-header">
            <span className="drawer-title">Menú</span>
            <button
              className="drawer-close"
              onClick={() => {
                setDrawerOpen(false);
                setMobileOpenIndex(null);
              }}
              aria-label="Cerrar menú"
              type="button"
            >
              ✕
            </button>
          </div>

          {/* Iconos dentro del drawer — SOLO cliente */}
          {isCustomer && (
            <div className="drawer-icons">
              <button
                className="icon-btn"
                onClick={handleSearchToggle}
                aria-label="Buscar"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 21l1-1-5.5-5.5zM5 10.5A5.5 5.5 0 1 1 10.5 16 5.51 5.51 0 0 1 5 10.5z" />
                </svg>
              </button>
              <button
                className="icon-btn"
                onClick={handleWishlist}
                aria-label="Favoritos"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-6.716-4.35-9.33-7.12C.5 11.6 1.09 8.16 3.64 6.84A4.86 4.86 0 0 1 12 8.17a4.86 4.86 0 0 1 8.36-1.33c2.55 1.32 3.14 4.76.97 7.04C18.716 16.65 12 21 12 21z" />
                </svg>
              </button>
              <Link
                to="/cart"
                className="icon-btn cart-btn"
                aria-label="Carrito"
                onClick={() => setDrawerOpen(false)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M7 4h-2l-1 2v2h2l3.6 7.59L8.24 18H19v-2H9.42l1.1-2h6.45a2 2 0 0 0 1.79-1.11L21 7H6.21l-.94-2H3" />
                </svg>
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </Link>
            </div>
          )}

          {/* Buscador compacto — solo cliente */}
          {isCustomer && (
            <div className="drawer-search">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = e.currentTarget.elements.qm.value.trim();
                  if (!q) return;
                  setDrawerOpen(false);
                  setMobileOpenIndex(null);
                  setShowSearch(false);
                  navigate(`/tienda?q=${encodeURIComponent(q)}`);
                }}
              >
                <input
                  name="qm"
                  type="search"
                  placeholder="Buscar…"
                  aria-label="Buscar en móvil"
                />
                <button type="submit">Ir</button>
              </form>
            </div>
          )}

          <div className="drawer-content">
            {items.map((item, idx) => {
              const hasChildren =
                Array.isArray(item.children) && item.children.length > 0;
              const isOpen = mobileOpenIndex === idx;
              const parentActive =
                isMatch(location.pathname, item.activeMatch || item.to) ||
                (hasChildren &&
                  item.children.some((c) =>
                    isMatch(location.pathname, c.activeMatch || c.to)
                  ));

              return (
                <div
                  key={`drawer-${item.to || item.label || "item"}-${idx}`}
                  className={`drawer-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    className={`drawer-parent ${parentActive ? "active" : ""}`}
                    onClick={() => {
                      if (!hasChildren) {
                        setDrawerOpen(false);
                        navigate(item.to);
                      } else {
                        setMobileOpenIndex((cur) => (cur === idx ? null : idx));
                      }
                    }}
                    aria-expanded={isOpen}
                    aria-haspopup={hasChildren ? "true" : "false"}
                    type="button"
                  >
                    <span>{item.label}</span>
                    {hasChildren && (
                      <span className="chev" aria-hidden>
                        {isOpen ? "▴" : "▾"}
                      </span>
                    )}
                  </button>

                  {hasChildren && (
                    <div
                      className="drawer-children"
                      style={{ maxHeight: isOpen ? "480px" : "0" }}
                    >
                      {item.children.map((child, cIdx) => {
                        const childActive = isMatch(
                          location.pathname,
                          child.activeMatch || child.to
                        );
                        return (
                          <Link
                            key={`drawer-${item.to || "root"}::${
                              child.to || child.label
                            }::${cIdx}`}
                            to={child.to}
                            onClick={() => {
                              setDrawerOpen(false);
                              setMobileOpenIndex(null);
                            }}
                            className={`drawer-link ${
                              childActive ? "active" : ""
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="drawer-sep" />

            {user && (
              <>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("Perfil estará disponible pronto.", "info");
                  }}
                  className={`drawer-link support-mobile ${
                    isSupportActive ? "active" : ""
                  }`}
                  aria-label="Perfil"
                  title="Perfil"
                >
                  Perfil
                  {unreadCount > 0 && (
                    <span className="badge-inline">{unreadCount}</span>
                  )}
                </Link>

                <Link
                  to={goSupportPath}
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                  }}
                  className={`drawer-link support-mobile ${
                    isSupportActive ? "active" : ""
                  }`}
                >
                  Soporte
                  {unreadCount > 0 && (
                    <span className="badge-inline">{unreadCount}</span>
                  )}
                </Link>

                {/* Botón Salir en menú hamburguesa */}
                <button
                  className="drawer-logout"
                  onClick={() => {
                    setDrawerOpen(false);
                    setMobileOpenIndex(null);
                    setShowConfirm(true);
                  }}
                  type="button"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Backdrop móvil */}
        {drawerOpen && (
          <div
            className="backdrop"
            onClick={() => {
              setDrawerOpen(false);
              setMobileOpenIndex(null);
            }}
            aria-hidden
          />
        )}
      </nav>

      {showConfirm && (
        <ConfirmModal
          title="Cerrar sesión"
          message="¿Deseas cerrar sesión?"
          onConfirm={() => {
            setShowConfirm(false);
            handleLogoutConfirm();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default Navbar;
