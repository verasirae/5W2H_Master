'use client';

import React, { useState, useEffect } from 'react';
import { TaskList, TaskListMember, TaskListInvite } from '@/types/5w2h';
import { useAuth } from '@/lib/auth/auth-context';
import {
  X,
  Users,
  UserPlus,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Share2,
} from 'lucide-react';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: TaskList | null;
  onUpdateList?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface SystemUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  department: string | null;
  jobTitle: string | null;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  list,
  onUpdateList,
  showToast,
}) => {
  const { user: currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'invite' | 'members' | 'invites'>('invite');
  
  // Data states
  const [members, setMembers] = useState<TaskListMember[]>([]);
  const [invites, setInvites] = useState<TaskListInvite[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Invite form state
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Removing member or cancelling invite state
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isOwner = list?.ownerId === currentUser?.id || isAdmin;
  const listId = list?.id;

  // Refetch members and invites after user interactions (inviting, removing, cancelling, or manual refresh)
  const reloadData = React.useCallback(async (targetListId: string) => {
    setIsLoadingData(true);
    try {
      const [membersRes, usersRes] = await Promise.all([
        fetch(`/api/lists/${targetListId}/members`),
        fetch('/api/users'),
      ]);
      const [membersJson, usersJson] = await Promise.all([
        membersRes.json(),
        usersRes.json(),
      ]);
      if (membersJson.success) {
        setMembers(membersJson.members || []);
        setInvites(membersJson.invites || []);
      }
      if (usersJson.success && Array.isArray(usersJson.users)) {
        setSystemUsers(usersJson.users);
      }
    } catch (err: any) {
      console.error('Erro ao recarregar dados de compartilhamento:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleClose = () => {
    setSelectedUserIds([]);
    setInviteMessage('');
    setSearchUserQuery('');
    setActiveTab('invite');
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !listId) return;
    let isMounted = true;

    Promise.all([
      fetch(`/api/lists/${listId}/members`).then((r) => r.json()),
      fetch('/api/users').then((r) => r.json()),
    ])
      .then(([membersJson, usersJson]) => {
        if (!isMounted) return;
        if (membersJson?.success) {
          setMembers(membersJson.members || []);
          setInvites(membersJson.invites || []);
        }
        if (usersJson?.success && Array.isArray(usersJson.users)) {
          setSystemUsers(usersJson.users);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar dados de compartilhamento:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, listId]);

  if (!isOpen || !list) return null;

  // Filter available users to invite (exclude current user and already existing members)
  const existingMemberUserIds = new Set(members.map((m) => m.userId).concat([list.ownerId]));
  const availableUsers = systemUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (existingMemberUserIds.has(u.id)) return false;
    if (!searchUserQuery.trim()) return true;
    const q = searchUserQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      showToast('error', 'Atenção', 'Selecione pelo menos um usuário para convidar.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/lists/${list.id}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          message: inviteMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Convites Enviados', data.message || 'Convite(s) enviado(s) com sucesso.');
        setSelectedUserIds([]);
        setInviteMessage('');
        if (list.id) reloadData(list.id);
        setActiveTab('invites');
        if (onUpdateList) onUpdateList();
      } else {
        showToast('error', 'Falha ao Enviar', data.error || 'Não foi possível enviar os convites.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${memberName || 'este membro'} da lista compartilhada?`)) {
      return;
    }

    setProcessingId(memberUserId);
    try {
      const res = await fetch(`/api/lists/${list.id}/members?userId=${memberUserId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Membro Removido', data.message || 'Membro removido da lista.');
        if (list.id) reloadData(list.id);
        if (onUpdateList) onUpdateList();
      } else {
        showToast('error', 'Erro', data.error || 'Não foi possível remover o membro.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Deseja realmente cancelar este convite pendente?')) {
      return;
    }

    setProcessingId(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Convite Cancelado', data.message || 'Convite cancelado.');
        if (list.id) reloadData(list.id);
        if (onUpdateList) onUpdateList();
      } else {
        showToast('error', 'Erro', data.error || 'Não foi possível cancelar o convite.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-card text-card-foreground border border-border w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                Compartilhar Lista: <span className="text-primary font-mono-data">{list.title}</span>
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono-data">
                Colaboração sincronizada em tempo real com membros da equipe
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-none cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Collaboration Banner */}
        <div className="px-5 py-2.5 bg-primary/5 border-b border-border flex items-center gap-2.5 text-xs text-muted-foreground font-mono-data">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Referência Compartilhada:</strong> Todos os membros convidados visualizam e editam as mesmas tarefas 5W2H em tempo real.
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-border px-5 bg-card shrink-0">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'invite'
                ? 'border-primary text-primary bg-accent/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Convidar Usuários</span>
            {selectedUserIds.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-primary text-primary-foreground font-bold">
                {selectedUserIds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-primary text-primary bg-accent/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Membros Ativos</span>
            <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-muted text-muted-foreground font-mono-data">
              {members.length + (members.some((m) => m.userId === list.ownerId) ? 0 : 1)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'invites'
                ? 'border-primary text-primary bg-accent/40'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Convites Pendentes</span>
            {invites.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                {invites.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (listId) reloadData(listId);
            }}
            disabled={isLoadingData}
            className="ml-auto p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Atualizar lista de membros"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono-data text-xs">
          {/* TAB 1: INVITE USERS */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              {!isOwner ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Apenas o proprietário da lista ({list.owner?.name || list.owner?.email || 'Criador'}) tem permissão para enviar novos convites.</span>
                </div>
              ) : (
                <form onSubmit={handleSendInvites} className="space-y-4">
                  {/* Search Bar */}
                  <div>
                    <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">
                      1. Selecionar Membros para Convidar
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        placeholder="Buscar colaboradores por nome, e-mail ou departamento..."
                        className="w-full bg-background border border-input text-foreground text-xs pl-8 pr-3 py-2 focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Users Selection List */}
                  <div className="border border-border bg-background/50 max-h-48 overflow-y-auto divide-y divide-border/50">
                    {availableUsers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-xs">
                        {systemUsers.length === 0
                          ? 'Carregando lista de usuários do sistema...'
                          : 'Nenhum usuário disponível para convidar com o filtro atual.'}
                      </div>
                    ) : (
                      availableUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        const isPending = invites.some((inv) => inv.inviteeId === u.id && inv.status === 'pendente');
                        return (
                          <div
                            key={u.id}
                            onClick={() => !isPending && toggleUserSelection(u.id)}
                            className={`p-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                              isPending
                                ? 'opacity-60 bg-muted/40 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary/10 border-l-2 border-primary'
                                : 'hover:bg-muted/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center font-bold text-[10px] text-foreground shrink-0 uppercase">
                                {u.name ? u.name.slice(0, 2) : u.email.slice(0, 2)}
                              </div>
                              <div className="truncate">
                                <p className="font-semibold text-foreground truncate">
                                  {u.name || u.email.split('@')[0]}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {u.department && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border">
                                  {u.department}
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 bg-background text-muted-foreground border border-border uppercase font-semibold">
                                {u.role}
                              </span>
                              {isPending ? (
                                <span className="text-[9px] text-amber-500 font-bold px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/10">
                                  Convite Pendente
                                </span>
                              ) : (
                                <div
                                  className={`w-4 h-4 border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-primary border-primary text-primary-foreground'
                                      : 'border-input bg-background'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected count indicator */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {selectedUserIds.length} usuário(s) selecionado(s)
                    </span>
                    {selectedUserIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedUserIds([])}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">
                      2. Mensagem do Convite (Opcional)
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Ex: Olá! Estou convidando você para colaborar nas tarefas 5W2H deste plano de ação..."
                      rows={2}
                      className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-background border border-border text-foreground hover:bg-muted transition-colors cursor-pointer uppercase font-semibold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSending || selectedUserIds.length === 0}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer uppercase font-semibold text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Enviando...' : `Enviar ${selectedUserIds.length} Convite(s)`}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Membros que possuem acesso à lista em tempo real:</span>
              </div>

              <div className="border border-border bg-background/50 divide-y divide-border">
                {/* 1. Show Owner */}
                <div className="p-3 flex items-center justify-between gap-3 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 border border-primary/40 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {list.owner?.name ? list.owner.name.slice(0, 2) : list.owner?.email.slice(0, 2) || 'PR'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-xs">
                          {list.owner?.name || list.owner?.email?.split('@')[0] || 'Proprietário'}
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] bg-primary text-primary-foreground font-bold uppercase">
                          Proprietário (Criador)
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{list.owner?.email}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Show accepted members */}
                {members.filter((m) => m.userId !== list.ownerId).length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-xs">
                    Nenhum membro convidado ativo nesta lista ainda. Use a aba &ldquo;Convidar Usuários&rdquo; para adicionar colaboradores.
                  </div>
                ) : (
                  members
                    .filter((m) => m.userId !== list.ownerId)
                    .map((m) => (
                      <div key={m.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-muted border border-border flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {m.user?.name ? m.user.name.slice(0, 2) : m.user?.email.slice(0, 2) || 'MB'}
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {m.user?.name || m.user?.email.split('@')[0] || 'Membro'}
                              </span>
                              <span className="px-1.5 py-0.2 text-[9px] bg-muted text-muted-foreground border border-border font-semibold uppercase">
                                Membro
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{m.user?.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {m.user?.department && (
                            <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border">
                              {m.user.department}
                            </span>
                          )}

                          {/* Owner can remove member, or member can remove self */}
                          {(isOwner || m.userId === currentUser?.id) && (
                            <button
                              onClick={() => handleRemoveMember(m.userId, m.user?.name || m.user?.email || 'membro')}
                              disabled={processingId === m.userId}
                              className="p-1.5 text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/30 transition-colors cursor-pointer"
                              title={m.userId === currentUser?.id ? 'Sair desta lista' : 'Remover membro da lista'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PENDING INVITES */}
          {activeTab === 'invites' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Convites enviados aguardando aceitação:</span>
              </div>

              <div className="border border-border bg-background/50 divide-y divide-border">
                {invites.length === 0 ? (
                  <div className="p-5 text-center text-muted-foreground text-xs">
                    Nenhum convite pendente no momento.
                  </div>
                ) : (
                  invites.map((inv) => (
                    <div key={inv.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {inv.invitee?.name || inv.invitee?.email.split('@')[0] || 'Usuário Convidado'}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 uppercase">
                              Pendente
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{inv.invitee?.email}</p>
                          {inv.message && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5">&ldquo;{inv.message}&rdquo;</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOwner && (
                          <button
                            onClick={() => handleCancelInvite(inv.id)}
                            disabled={processingId === inv.id}
                            className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 border border-destructive/30 transition-colors cursor-pointer flex items-center gap-1"
                            title="Cancelar este convite"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Cancelar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs font-mono-data">
          <span className="text-muted-foreground text-[11px]">
            {members.length + 1} membro(s) com acesso total à lista
          </span>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-background border border-border text-foreground hover:bg-muted transition-colors cursor-pointer uppercase font-semibold text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
