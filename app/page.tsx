'use client';

import React, { useEffect } from 'react';
import { use5W2H } from '@/hooks/use5w2h';
import { useAuth } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/Navbar';
import { Header } from '@/components/Header';
import { FiltersBar } from '@/components/FiltersBar';
import { DashboardView } from '@/components/DashboardView';
import { TaskTableView } from '@/components/TaskTableView';
import { TaskCardsView } from '@/components/TaskCardsView';
import { TaskKanbanView } from '@/components/TaskKanbanView';
import { TeamMonitoringView } from '@/components/TeamMonitoringView';
import { AiGeneratorView } from '@/components/AiGeneratorView';
import { SettingsView } from '@/components/SettingsView';
import { UserManagementView } from '@/components/UserManagementView';
import { ProfileView } from '@/components/ProfileView';
import { TaskFormModal } from '@/components/TaskFormModal';
import { MatrixModal } from '@/components/MatrixModal';
import { NotificationToast } from '@/components/NotificationToast';
import { PendingApprovalView } from '@/components/PendingApprovalView';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

export default function HomePage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = React.useState(false);
  const { user, isPending, isAdmin, isManager, isMember, isLoading: isAuthLoading } = useAuth();

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
    clearAllData,
    isLoading,
    isSyncing,
    refreshTasks,
    dbStatus,
    syncTasksToDatabase,
  } = use5W2H();

  // Guard against view permission mismatches
  useEffect(() => {
    if (!isAuthLoading && user) {
      if (currentView === 'users' && !isAdmin) {
        setCurrentView('dashboard');
      } else if (currentView === 'settings' && !isAdmin) {
        setCurrentView('dashboard');
      } else if (currentView === 'team' && !isAdmin && !isManager) {
        setCurrentView('dashboard');
      }
    }
  }, [currentView, isAdmin, isManager, isAuthLoading, user, setCurrentView]);

  // If user is pending approval, show dedicated pending approval screen
  if (!isAuthLoading && user && isPending) {
    return <PendingApprovalView />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Impersonation Banner at top */}
      <ImpersonationBanner />

      <div className="flex flex-1 w-full overflow-hidden">
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
            isSyncing={isSyncing}
            dbStatus={dbStatus}
            onRefresh={refreshTasks}
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
                isLoading={isLoading}
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
                isLoading={isLoading}
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
                isLoading={isLoading}
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
                isLoading={isLoading}
              />
            )}

            {currentView === 'team' && (
              <TeamMonitoringView
                workspaceConfig={workspaceConfig}
                openMatrixModal={openMatrixModal}
                openEditModal={openEditModal}
                showToast={showToast}
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

            {currentView === 'users' && (
              <UserManagementView
                departments={availableDepartments}
                showToast={showToast}
              />
            )}

            {currentView === 'profile' && (
              <ProfileView
                departments={availableDepartments}
                showToast={showToast}
                openEditModal={openEditModal}
                openMatrixModal={openMatrixModal}
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                workspaceConfig={workspaceConfig}
                setWorkspaceConfig={setWorkspaceConfig}
                clearAllData={clearAllData}
                showToast={showToast}
                dbStatus={dbStatus}
                syncTasksToDatabase={syncTasksToDatabase}
              />
            )}
          </main>
        </div>
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
