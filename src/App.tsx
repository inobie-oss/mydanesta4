/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, FrameData } from './types';
import { getSampleProjects } from './utils/sampleProjects';
import MainPage from './components/MainPage';
import ProjectPage from './components/ProjectPage';
import ProjectCreateModal from './components/ProjectCreateModal';

const STORAGE_KEY = 'mydanest_v1_projects';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load projects from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Robust Sanitization: Ensure all required collections and properties are fully established
          const sanitized = parsed.map((p: any) => {
            const bones = Array.isArray(p.bones) ? p.bones : [];
            const layers = Array.isArray(p.layers) ? p.layers : [];
            const assets = Array.isArray(p.assets) ? p.assets : [];
            const keyframes = (p.keyframes && typeof p.keyframes === 'object') ? p.keyframes : {};

            const sanitizedKeyframes: any = {};
            Object.keys(keyframes).forEach((kfKey) => {
              const kf = keyframes[kfKey] || {};
              sanitizedKeyframes[kfKey] = {
                bones: kf.bones && typeof kf.bones === 'object' ? kf.bones : {},
                layers: kf.layers && typeof kf.layers === 'object' ? kf.layers : {}
              };
            });

            return {
              id: p.id || 'proj-' + Date.now() + Math.random().toString(36).substring(2, 7),
              name: p.name || 'Untitled Project',
              width: Number(p.width) || 800,
              height: Number(p.height) || 600,
              fps: Number(p.fps) || 24,
              playbackLength: Number(p.playbackLength) || 48,
              backgroundColor: p.backgroundColor || '#111827',
              assets,
              bones,
              layers,
              keyframes: sanitizedKeyframes,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString()
            };
          });

          setProjects(sanitized);
          return;
        }
      }
    } catch (e) {
      console.warn("localStorage loading failed, fallback to templates", e);
    }

    // fallback to beautiful templates
    const templates = getSampleProjects();
    setProjects(templates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, []);

  // Save projects to localStorage helper
  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (e) {
      console.error("Failed to persist projects inside localStorage", e);
    }
  };

  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
  };

  const handleExitProject = () => {
    setActiveProjectId(null);
  };

  // Add a new project manually
  const handleCreateProject = (
    name: string,
    width: number,
    height: number,
    fps: number,
    length: number,
    backgroundColor: string
  ) => {
    // Create a new empty project
    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name,
      width,
      height,
      fps,
      playbackLength: length,
      backgroundColor,
      assets: [], // starts empty for custom uploads
      bones: [], // starts empty as requested by user
      layers: [], // starts empty
      keyframes: {
        // Prepare empty frame zero keyframe automatically
        0: {
          bones: {},
          layers: {}
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const nextProjects = [newProject, ...projects];
    saveProjectsToStorage(nextProjects);
    setIsModalOpen(false);
    
    // Auto translate directly into project editor view!
    setActiveProjectId(newProject.id);
  };

  // Duplicate a project configuration
  const handleDuplicateProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;

    // Deep clone project configurations
    const duplicated: Project = JSON.parse(JSON.stringify(target));
    duplicated.id = 'proj-' + Date.now();
    duplicated.name = `${duplicated.name} (Copy)`;
    duplicated.createdAt = new Date().toISOString();
    duplicated.updatedAt = new Date().toISOString();

    const nextProjects = [duplicated, ...projects];
    saveProjectsToStorage(nextProjects);
  };

  // Delete a project
  const handleDeleteProject = (id: string) => {
    const nextProjects = projects.filter((p) => p.id !== id);
    saveProjectsToStorage(nextProjects);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  // Overwrites a project in lists
  const handleSaveProject = (updatedProject: Project) => {
    const nextProjects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    saveProjectsToStorage(nextProjects);
  };

  // Find currently active project structure
  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <>
      {activeProject ? (
        <ProjectPage
          project={activeProject}
          onExit={handleExitProject}
          onSaveProject={handleSaveProject}
        />
      ) : (
        <MainPage
          projects={projects}
          onOpenProject={handleOpenProject}
          onAddProjectClick={() => setIsModalOpen(true)}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {/* Pop-up dialog create project settings */}
      <ProjectCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </>
  );
}
