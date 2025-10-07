import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import ClientModal from '../components/ClientModal';
import Navbar from '../components/Navbar';
import MainMenu from '../components/MainMenu';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  ArrowLeft
} from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const dropdownRefs = useRef({});

  const { user } = useAuth();
  const userId = user.id;

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && dropdownRefs.current[dropdownOpen]) {
        const dropdownElement = dropdownRefs.current[dropdownOpen];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setDropdownOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    fetchClients();
  }, [currentPage, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        user_id: userId,
        page: currentPage.toString(),
        per_page: isMobileView ? '5' : '10',
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`${API_BASE_URL}/api/clients?${params}`);
      const data = await response.json();

      if (data.success) {
        setClients(data.clients);
        setPagination(data.pagination);
      } else {
        showNotification('Error fetching clients', 'error');
      }
    } catch (error) {
      showNotification('Failed to fetch clients', 'error');
    }
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCreateClient = () => {
    setModalType('create');
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setModalType('edit');
    setSelectedClient(client);
    setShowModal(true);
    setDropdownOpen(null);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
    setDropdownOpen(null);
  };

  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleModalSuccess = (message) => {
    showNotification(message);
    setShowModal(false);
    setSelectedClient(null);
    fetchClients();
  };

  const confirmDelete = async () => {
    try {
      if (selectedClients.length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/clients/bulk-delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_ids: selectedClients })
        });

        const data = await response.json();
        if (data.success) {
          showNotification(`Successfully deleted ${data.deleted_count} clients`);
          setSelectedClients([]);
        } else {
          showNotification(data.error || 'Failed to delete clients', 'error');
        }
      } else if (selectedClient) {
        const response = await fetch(`${API_BASE_URL}/api/clients/${selectedClient.id}`, {
          method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
          showNotification('Client deleted successfully');
        } else {
          showNotification(data.error || 'Failed to delete client', 'error');
        }
      }

      setShowDeleteModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      showNotification('Network error occurred', 'error');
    }
  };

  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(client => client.id));
    }
  };

  const toggleDropdown = (clientId, event) => {
    if (event) {
      event.stopPropagation();
    }
    setDropdownOpen(dropdownOpen === clientId ? null : clientId);
  };

  // Mobile-friendly client card component
  const ClientCard = ({ client }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-2 font-semibold text-gray-900 text-base">{client.name}</div>
        </div>
        <button
          onClick={(e) => toggleDropdown(client.id, e)}
          data-dropdown-button={client.id}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}

        {client.address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-3 w-3 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{client.address}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="h-3 w-3 mr-1" />
            {client.invoice_count || 0} invoices
          </div>
          <div className="text-xs text-gray-400">
            Added {new Date(client.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:block hidden sticky top-0 left-0 w-full z-30">
        <MainMenu showLogo={false} />
      </div>
      <div className="md:hidden block">
        <MainMenu />
      </div>

      {/* Dropdown Portals - Fixed z-index */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setDropdownOpen(null)}>
          {(() => {
            const buttonElement = document.querySelector(`[data-dropdown-button="${dropdownOpen}"]`);
            if (!buttonElement) return null;

            const rect = buttonElement.getBoundingClientRect();
            const isMobile = window.innerWidth < 768;

            return (
              <div
                ref={(el) => {
                  dropdownRefs.current[dropdownOpen] = el;
                }}
                className="absolute w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-60"
                style={{
                  top: rect.bottom + 8,
                  left: isMobile ? Math.max(16, rect.left - 96) : rect.right - 192,
                  right: isMobile ? '16px' : 'auto',
                  maxWidth: isMobile ? 'calc(100vw - 32px)' : 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleEditClient(clients.find(c => c.id === dropdownOpen))}
                    className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Edit className="h-4 w-4 mr-3 text-gray-400 group-hover:text-gray-500" />
                    Edit Client
                  </button>
                  <button
                    onClick={() => handleDeleteClient(clients.find(c => c.id === dropdownOpen))}
                    className="group flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                  >
                    <Trash2 className="h-4 w-4 mr-3 text-red-400 group-hover:text-red-500" />
                    Delete Client
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4 md:py-6">
              <div className="flex items-center space-x-3 gap-4 md:gap-6">
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center p-2 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>

                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900">Clients</h1>
                </div>
              </div>
              <button
                onClick={handleCreateClient}
                className="inline-flex items-center p-2 md:px-4 md:py-3 !bg-neutral-900 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                <span className="text-sm md:text-base">Add <span className="hidden sm:inline">Client</span></span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-20 md:mb-40 lg:px-8 py-4 md:py-8">
          {/* Search and Actions */}
          <div className="rounded-xl py-3 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 md:py-3 border-2 !bg-gray-150 !border-neutral-200 !rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>

              {selectedClients.length > 0 && (
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {selectedClients.length} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clients List/Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-8 md:py-12">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 text-sm md:text-base">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Users className="h-8 w-8 md:h-12 md:w-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500 text-sm md:text-base mb-4 px-4">
                  {searchTerm ? 'No clients match your search criteria.' : 'Get started by adding your first client.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateClient}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Client
                  </button>
                )}
              </div>
            ) : isMobileView ? (
              // Mobile Card View
              <div className="p-3">
                {clients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            ) : (
              // Desktop Table View
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedClients.length === clients.length && clients.length > 0}
                          onChange={toggleAllClients}
                        />
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoices
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedClients.includes(client.id)}
                            onChange={() => toggleClientSelection(client.id)}
                          />
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="flex-row h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>

                              </div>
                            </div>
                            <div className="ml-3 md:ml-4">
                             <div className="text-sm font-medium text-gray-900">{client.name}</div>

                              {client.address && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-xs">{client.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="h-3 w-3 mr-2 text-gray-400" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{client.invoice_count || 0}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-gray-500">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right relative">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={(e) => toggleDropdown(client.id, e)}
                              data-dropdown-button={client.id}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="bg-white px-4 md:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {((currentPage - 1) * pagination.per_page) + 1} to {Math.min(currentPage * pagination.per_page, pagination.total)} of {pagination.total} clients
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.has_prev}
                    className="inline-flex items-center px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="text-sm text-gray-500 px-2">
                    {currentPage} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={!pagination.has_next}
                    className="inline-flex items-center px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Client Modal */}
        <ClientModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          client={selectedClient}
          mode={modalType}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-4 md:p-6">
                <div className="flex items-center mb-3 md:mb-4">
                  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base md:text-lg font-medium text-gray-900">
                      Confirm Deletion
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4 md:mb-6">
                  {selectedClients.length > 0
                    ? `Are you sure you want to delete ${selectedClients.length} selected clients? This action cannot be undone.`
                    : `Are you sure you want to delete "${selectedClient?.name}"? This action cannot be undone.`
                  }
                </p>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedClient(null);
                    }}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base order-1 sm:order-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed bottom-4 right-4 left-4 md:left-auto z-70 max-w-sm md:max-w-md">
            <div className={`flex items-center p-3 md:p-4 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-100 border border-green-200 text-green-800'
                : 'bg-red-100 border border-red-200 text-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3 text-red-600" />
              )}
              <span className="text-sm font-medium flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      <Navbar />
    </>
  );
};

export default ClientsPage;