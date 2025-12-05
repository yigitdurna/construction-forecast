/**
 * Project Storage Hook
 *
 * Phase 2.4 - LocalStorage persistence for feasibility projects
 */

import { useState, useEffect, useCallback } from 'react';
import type { FeasibilityProject, ProjectListItem } from '../types/project';
import { projectToListItem, createEmptyProject } from '../types/project';

const STORAGE_KEY = 'construction-forecast-projects';
const MAX_PROJECTS = 50;

/**
 * Get all projects from LocalStorage
 */
function getStoredProjects(): FeasibilityProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const projects = JSON.parse(data) as FeasibilityProject[];
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error('Failed to load projects from storage:', error);
    return [];
  }
}

/**
 * Save projects array to LocalStorage
 */
function setStoredProjects(projects: FeasibilityProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save projects to storage:', error);
  }
}

/**
 * Hook for project storage operations
 */
export function useProjectStorage() {
  const [projects, setProjects] = useState<FeasibilityProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects on mount
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);
    setIsLoading(false);
  }, []);

  /**
   * Get all projects as list items
   */
  const getProjectList = useCallback((): ProjectListItem[] => {
    return projects
      .map(projectToListItem)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [projects]);

  /**
   * Get project by ID
   */
  const getProject = useCallback(
    (id: string): FeasibilityProject | null => {
      return projects.find((p) => p.id === id) || null;
    },
    [projects]
  );

  /**
   * Save project (create or update)
   */
  const saveProject = useCallback(
    (project: FeasibilityProject): void => {
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      setProjects((prev) => {
        const index = prev.findIndex((p) => p.id === project.id);

        let updated: FeasibilityProject[];
        if (index >= 0) {
          // Update existing
          updated = [...prev];
          updated[index] = updatedProject;
        } else {
          // Add new
          updated = [...prev, updatedProject];

          // Enforce max projects limit
          if (updated.length > MAX_PROJECTS) {
            // Sort by updatedAt (oldest first) and remove oldest
            updated.sort(
              (a, b) =>
                new Date(a.updatedAt).getTime() -
                new Date(b.updatedAt).getTime()
            );
            updated.shift();
          }
        }

        setStoredProjects(updated);
        return updated;
      });
    },
    []
  );

  /**
   * Create new project
   */
  const createProject = useCallback((name?: string): FeasibilityProject => {
    const newProject = createEmptyProject({ name });
    saveProject(newProject);
    return newProject;
  }, [saveProject]);

  /**
   * Delete project by ID
   */
  const deleteProject = useCallback((id: string): void => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setStoredProjects(updated);
      return updated;
    });
  }, []);

  /**
   * Duplicate project
   */
  const duplicateProject = useCallback(
    (id: string): FeasibilityProject | null => {
      const original = getProject(id);
      if (!original) return null;

      const duplicate: FeasibilityProject = {
        ...original,
        id: crypto.randomUUID(),
        name: `${original.name} (Kopya)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveProject(duplicate);
      return duplicate;
    },
    [getProject, saveProject]
  );

  /**
   * Rename project
   */
  const renameProject = useCallback(
    (id: string, newName: string): void => {
      const project = getProject(id);
      if (project) {
        saveProject({ ...project, name: newName });
      }
    },
    [getProject, saveProject]
  );

  /**
   * Clear all projects (use with caution)
   */
  const clearAllProjects = useCallback((): void => {
    setProjects([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Export projects as JSON file
   */
  const exportProjects = useCallback((): void => {
    const dataStr = JSON.stringify(projects, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `fizibilite-projeler-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }, [projects]);

  /**
   * Import projects from JSON file
   */
  const importProjects = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const importedProjects = JSON.parse(
            e.target?.result as string
          ) as FeasibilityProject[];

          if (!Array.isArray(importedProjects)) {
            throw new Error('Invalid format');
          }

          // Add imported projects (assign new IDs to avoid conflicts)
          const newProjects = importedProjects.map((p) => ({
            ...p,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          setProjects((prev) => {
            const updated = [...prev, ...newProjects];
            setStoredProjects(updated);
            return updated;
          });

          resolve(newProjects.length);
        } catch (error) {
          reject(new Error('Geçersiz dosya formatı'));
        }
      };

      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsText(file);
    });
  }, []);

  return {
    // State
    projects,
    isLoading,

    // Read operations
    getProjectList,
    getProject,

    // Write operations
    saveProject,
    createProject,
    deleteProject,
    duplicateProject,
    renameProject,

    // Bulk operations
    clearAllProjects,
    exportProjects,
    importProjects,
  };
}

export default useProjectStorage;
