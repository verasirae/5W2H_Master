'use client';

import React from 'react';
import { use5W2H } from '@/hooks/use5w2h';
import { Navbar } from '@/components/Navbar';
import { Header } from '@/components/Header';
import { FiltersBar } from '@/components/FiltersBar';
import { DashboardView } from '@/components/DashboardView';
import { TaskTableView } from '@/components/TaskTableView';
import { TaskCardsView } from '@/components/TaskCardsView';
import { TaskKanbanView } from '@/components/TaskKanbanView';
import { AiGeneratorView } from '@/components/AiGeneratorView';
import { SettingsView } from '@/components/SettingsView';
import { TaskFormModal } from '@/components/TaskFormModal';
import { MatrixModal } from '@/components/MatrixModal';
import { NotificationToast } from '@/components/NotificationToast';

export default function HomePage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);

  const {
    tasks,
    filteredTasks,
    workspaceConfig,
    setWorkspaceConfig,
    currentView,
    setCurrentView,
    filters,
    setFilters,
    resetFilters,
    availableDepartments,
    availableCategories,
    availableCompetences,
    availableResponsibles,
    isFormModalOpen,
    setIsFormModalOpen,
    editingTask,
    openCreateModal,
    openEditModal,
    addTask,
    addMultipleTasks,
    updateTask,
    deleteTask,
    changeTaskStatus,
    isMatrixModalOpen,
    setIsMatrixModalOpen,
    inspectingTask,
    openMatrixModal,
    toast,
    showToast,
    resetToSampleData,
    clearAllData,
    dbStatus,
    syncTasksToDatabase,
  } = use5W2H();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Side Navigation Shell */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openCreateModal={openCreateModal}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <Header
          workspaceConfig={workspaceConfig}
          currentView={currentView}
          setCurrentView={setCurrentView}
          searchQuery={filters.searchQuery}
          setSearchQuery={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
          filteredTasks={filteredTasks}
          openCreateModal={openCreateModal}
          showToast={showToast}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />

        {/* Combinable Filters Bar (Visible on data views: dashboard, table, cards, kanban) */}
        {['dashboard', 'table', 'cards', 'kanban'].includes(currentView) && (
          <FiltersBar
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            availableDepartments={availableDepartments}
            availableCategories={availableCategories}
            availableCompetences={availableCompetences}
            availableResponsibles={availableResponsibles}
            totalFilteredCount={filteredTasks.length}
            totalCount={tasks.length}
            openCreateModal={openCreateModal}
          />
        )}

        {/* Dynamic View Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative w-full">
          {currentView === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              filteredTasks={filteredTasks}
              workspaceConfig={workspaceConfig}
              openCreateModal={openCreateModal}
            />
          )}

          {currentView === 'table' && (
            <TaskTableView
              tasks={filteredTasks}
              workspaceConfig={workspaceConfig}
              openEditModal={openEditModal}
              openMatrixModal={openMatrixModal}
              deleteTask={deleteTask}
              changeTaskStatus={changeTaskStatus}
              openCreateModal={openCreateModal}
            />
          )}

          {currentView === 'cards' && (
            <TaskCardsView
              tasks={filteredTasks}
              workspaceConfig={workspaceConfig}
              openEditModal={openEditModal}
              openMatrixModal={openMatrixModal}
              deleteTask={deleteTask}
              changeTaskStatus={changeTaskStatus}
              openCreateModal={openCreateModal}
            />
          )}

          {currentView === 'kanban' && (
            <TaskKanbanView
              tasks={filteredTasks}
              workspaceConfig={workspaceConfig}
              openEditModal={openEditModal}
              openMatrixModal={openMatrixModal}
              changeTaskStatus={changeTaskStatus}
              openCreateModal={openCreateModal}
            />
          )}

          {currentView === 'ai' && (
            <AiGeneratorView
              workspaceConfig={workspaceConfig}
              addTask={addTask}
              addMultipleTasks={addMultipleTasks}
              showToast={showToast}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              workspaceConfig={workspaceConfig}
              setWorkspaceConfig={setWorkspaceConfig}
              resetToSampleData={resetToSampleData}
              clearAllData={clearAllData}
              showToast={showToast}
              dbStatus={dbStatus}
              syncTasksToDatabase={syncTasksToDatabase}
            />
          )}
        </main>
      </div>

      {/* Task Form Modal (CRUD) */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        editingTask={editingTask}
        workspaceConfig={workspaceConfig}
        onSave={addTask}
        onUpdate={updateTask}
      />

      {/* 5W2H Matrix Inspection Printable Modal */}
      <MatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        task={inspectingTask}
        workspaceConfig={workspaceConfig}
        openEditModal={openEditModal}
        deleteTask={deleteTask}
        showToast={showToast}
      />

      {/* Feedback Toast Notification */}
      <NotificationToast toast={toast} />
    </div>
  );
}
