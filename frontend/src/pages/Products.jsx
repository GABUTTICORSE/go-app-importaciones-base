import { useEffect, useMemo, useState } from 'react'
import OMP from '../assets/OMP.png'
import BELL from '../assets/BELL.png'
import STILO from '../assets/STILO.png'
import EVOCORSE from '../assets/EVOCORSE.png'
import ORECA from '../assets/ORECA.png'
import ENDLESS from '../assets/ENDLESS.png'
import LIFELINE from '../assets/LIFELINE.png'
import FASTIME from '../assets/FASTIME.png'

const SUPPLIER_LOGOS = {
    OMP,
    BELL,
    STILO,
    EVOCORSE,
    ORECA,
    ENDLESS,
    LIFELINE,
    FASTIME,
}
export default function Products({ globalSearch }) {
    const [products, setProducts] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const productsPerPage = 30
    const [filters, setFilters] = useState({
        codigo: '',
        nombre_producto: '',
        modelo: '',
        homologacion: '',
        color: '',
        talla: '',
        proveedor: '',
        precio: '',
        moneda: '',
    })

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || '/api'}/products`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('goapp_token')}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error(error));
    }, [])

    function normalize(value) {
        return String(value || '').toLowerCase()
    }

    function handleFilterChange(e) {
        const { name, value } = e.target

        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }))
        setCurrentPage(1)
    }

    function formatPrice(value) {
        return `$${new Intl.NumberFormat('es-CL').format(value || 0)}`
    }

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesGlobal =
                normalize(product.codigo).includes(normalize(globalSearch)) ||
                normalize(product.nombre_producto).includes(normalize(globalSearch)) ||
                normalize(product.proveedor).includes(normalize(globalSearch)) ||
                normalize(product.clasificacion).includes(normalize(globalSearch))

            const matchesColumns =
                normalize(product.codigo).includes(normalize(filters.codigo)) &&
                normalize(product.nombre_producto).includes(normalize(filters.nombre_producto)) &&
                normalize(product.modelo).includes(normalize(filters.modelo)) &&
                normalize(product.homologacion).includes(normalize(filters.homologacion)) &&
                normalize(product.color).includes(normalize(filters.color)) &&
                normalize(product.talla).includes(normalize(filters.talla)) &&
                normalize(product.proveedor).includes(normalize(filters.proveedor)) &&
                normalize(product.precio).includes(normalize(filters.precio)) &&
                normalize(product.moneda).includes(normalize(filters.moneda))

            return matchesGlobal && matchesColumns
        })
    }, [products, filters, globalSearch])
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

    const startIndex = (currentPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    function getSupplierLogo(supplier) {
        return SUPPLIER_LOGOS[supplier]
    }

    return (
        <section>
            <div className="orders-card">
                <div className="orders-header">
                    <div>
                        <h1>Productos</h1>
                        <p>{filteredProducts.length} productos encontrados</p>
                    </div>

                    <button
                        className="clear-filters-btn"
                        onClick={() =>
                            setFilters({
                                codigo: '',
                                nombre_producto: '',
                                modelo: '',
                                homologacion: '',
                                color: '',
                                talla: '',
                                proveedor: '',
                                precio: '',
                                moneda: '',
                            })
                        }
                    >
                        Limpiar filtros
                    </button>
                </div>

                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Modelo</th>
                            <th>Homologación</th>
                            <th>Color</th>
                            <th>Talla</th>
                            <th>Proveedor</th>
                            <th>Precio</th>
                            <th>Moneda</th>
                        </tr>

                        <tr className="filter-row">
                            <th>
                                <input
                                    name="codigo"
                                    value={filters.codigo}
                                    onChange={handleFilterChange}
                                    placeholder="Código"
                                />
                            </th>

                            <th>
                                <input
                                    name="nombre_producto"
                                    value={filters.nombre_producto}
                                    onChange={handleFilterChange}
                                    placeholder="Producto"
                                />
                            </th>

                            <th>
                                <input
                                    name="modelo"
                                    value={filters.modelo}
                                    onChange={handleFilterChange}
                                    placeholder="Modelo"
                                />
                            </th>

                            <th>
                                <input
                                    name="homologacion"
                                    value={filters.homologacion}
                                    onChange={handleFilterChange}
                                    placeholder="Homologación"
                                />
                            </th>

                            <th>
                                <input
                                    name="color"
                                    value={filters.color}
                                    onChange={handleFilterChange}
                                    placeholder="Color"
                                />
                            </th>

                            <th>
                                <input
                                    name="talla"
                                    value={filters.talla}
                                    onChange={handleFilterChange}
                                    placeholder="Talla"
                                />
                            </th>

                            <th>
                                <input
                                    name="proveedor"
                                    value={filters.proveedor}
                                    onChange={handleFilterChange}
                                    placeholder="Proveedor"
                                />
                            </th>

                            <th>
                                <input
                                    name="precio"
                                    value={filters.precio}
                                    onChange={handleFilterChange}
                                    placeholder="Precio"
                                />
                            </th>

                            <th>
                                <input
                                    name="moneda"
                                    value={filters.moneda}
                                    onChange={handleFilterChange}
                                    placeholder="Moneda"
                                />
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="9" className="empty-row">
                                    No hay productos que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}

                        {paginatedProducts.map((product) => (
                            <tr key={product._id}>
                                <td>{product.codigo}</td>
                                <td>{product.nombre_producto}</td>
                                <td>{product.modelo}</td>
                                <td>{product.homologacion}</td>
                                <td>{product.color}</td>
                                <td>{product.talla}</td>
                                <td>
                                    {getSupplierLogo(product.proveedor) ? (
                                        <img
                                            src={getSupplierLogo(product.proveedor)}
                                            alt={product.proveedor}
                                            className="supplier-logo"
                                        />
                                    ) : (
                                        product.proveedor || '-'
                                    )}
                                </td>
                                <td>{formatPrice(product.precio)}</td>
                                <td>{product.moneda}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="products-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                    >
                        Anterior
                    </button>

                    <span>
                        Página {currentPage} de {totalPages || 1}
                    </span>

                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </section>
    )
}