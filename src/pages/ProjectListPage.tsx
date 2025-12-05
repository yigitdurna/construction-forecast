/**
 * Project List Page
 *
 * Phase 2.4 Part 2 - Manage multiple feasibility projects
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStorage } from '../hooks/useProjectStorage';
import type { ProjectListItem } from '../types/project';

/**
 * ProjectListPage Component
 *
 * Displays all saved feasibility projects with management actions
 */
export function ProjectListPage(): JSX.Element {
  const {
    isLoading,
    getProjectList,
    deleteProject,
    duplicateProject,
    renameProject,
  } = useProjectStorage();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Load projects
  React.useEffect(() => {
    if (!isLoading) {
      setProjects(getProjectList());
    }
  }, [isLoading, getProjectList]);

  /**
   * Handle project deletion
   */
  const handleDelete = (id: string) => {
    if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
      deleteProject(id);
      setProjects(getProjectList());
    }
  };

  /**
   * Handle project duplication
   */
  const handleDuplicate = (id: string) => {
    const duplicate = duplicateProject(id);
    if (duplicate) {
      setProjects(getProjectList());
    }
  };

  /**
   * Start renaming a project
   */
  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setNewName(currentName);
  };

  /**
   * Save renamed project
   */
  const saveRename = () => {
    if (renamingId && newName.trim()) {
      renameProject(renamingId, newName.trim());
      setProjects(getProjectList());
      setRenamingId(null);
      setNewName('');
    }
  };

  /**
   * Cancel renaming
   */
  const cancelRename = () => {
    setRenamingId(null);
    setNewName('');
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /**
   * Format percentage
   */
  const formatPercent = (value: number): string => {
    return `%${(value * 100).toFixed(1)}`;
  };

  /**
   * Format date
   */
  const formatDate = (isoDate: string): string => {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Projeler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Fizibilite Projeleri
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Kayıtlı {projects.length} proje
            </p>
          </div>
          <Link
            to="/feasibility"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Yeni Proje
          </Link>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Henüz proje yok
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Yeni bir fizibilite analizi başlatın
            </p>
            <div className="mt-6">
              <Link
                to="/feasibility"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Yeni Proje Oluştur
              </Link>
            </div>
          </div>
        )}

        {/* Project Table */}
        {projects.length > 0 && (
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Proje Adı
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Parsel Bilgisi
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Kar
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Kar Marjı
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Durum
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Son Güncelleme
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      {renamingId === project.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename();
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            autoFocus
                          />
                          <button
                            onClick={saveRename}
                            className="text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelRename}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {project.parselInfo}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div
                        className={`text-sm font-medium ${
                          project.profit > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(project.profit)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatPercent(project.margin)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {project.isComplete ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                          Tamamlandı
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800">
                          Devam Ediyor
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(project.updatedAt)}
                    </td>
                    <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/feasibility?projectId=${project.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Aç
                        </Link>
                        <button
                          onClick={() =>
                            startRename(project.id, project.name)
                          }
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDuplicate(project.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Kopyala
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectListPage;
