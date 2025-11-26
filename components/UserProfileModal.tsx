import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { XIcon } from './icons/XIcon';
import { UserIcon } from './icons/UserIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
    isOpen,
    onClose,
    profile,
    onUpdateProfile,
    onChangePassword,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Profile edit state
    const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const currentProfile = { ...profile, ...editedProfile };

    const handleEdit = () => {
        setIsEditing(true);
        setEditedProfile({});
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedProfile({});
        setAvatarPreview(null);
    };

    const handleSave = async () => {
        // Check if any fields were actually edited
        if (Object.keys(editedProfile).length === 0) {
            alert('Nenhuma alteração foi feita.');
            return;
        }

        setIsSaving(true);
        try {
            await onUpdateProfile(editedProfile);
            setIsEditing(false);
            setEditedProfile({});
            setAvatarPreview(null);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Falha ao atualizar perfil. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload avatar immediately using API
        try {
            setIsSaving(true);
            const { api } = await import('../services/api');
            const avatarUrl = await api.profile.uploadAvatar(file);

            // Update profile with avatar URL
            setEditedProfile(prev => ({ ...prev, avatar: avatarUrl }));
            alert('Avatar atualizado com sucesso!');
        } catch (error) {
            console.error('Avatar upload failed:', error);
            alert('Falha ao fazer upload do avatar. Tente novamente.');
            setAvatarPreview(null);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError('Preencha todos os campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsSaving(true);
        try {
            await onChangePassword(oldPassword, newPassword);
            setIsChangingPassword(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert('Senha alterada com sucesso!');
        } catch (error) {
            console.error('Failed to change password:', error);
            setPasswordError('Senha atual incorreta ou erro ao alterar senha');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div
                                className={`w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold ${isEditing ? 'cursor-pointer' : ''}`}
                                onClick={handleAvatarClick}
                            >
                                {avatarPreview || currentProfile.avatar ? (
                                    <img
                                        src={
                                            avatarPreview ||
                                            (currentProfile.avatar?.startsWith('http')
                                                ? currentProfile.avatar
                                                : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${currentProfile.avatar}`)
                                        }
                                        alt={currentProfile.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="w-20 h-20" />
                                )}
                            </div>
                            {isEditing && (
                                <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                                    <PencilIcon className="w-8 h-8 text-white" />
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.name ?? currentProfile.name}
                                    onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Seu nome"
                                />
                            ) : (
                                <p className="text-gray-900 font-medium">{currentProfile.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editedProfile.email ?? currentProfile.email}
                                    onChange={(e) => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="seu@email.com"
                                />
                            ) : (
                                <p className="text-gray-900">{currentProfile.email}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            {isEditing ? (
                                <textarea
                                    value={editedProfile.bio ?? currentProfile.bio ?? ''}
                                    onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    rows={3}
                                    placeholder="Conte um pouco sobre você..."
                                />
                            ) : (
                                <p className="text-gray-700">{currentProfile.bio || 'Nenhuma bio adicionada'}</p>
                            )}
                        </div>

                        {/* Role (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                            <p className="text-gray-900">{currentProfile.role || 'Editor'}</p>
                        </div>

                        {/* Member Since (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Membro desde</label>
                            <p className="text-gray-900">{formatDate(currentProfile.createdAt)}</p>
                        </div>
                    </div>

                    {/* Edit/Save Buttons */}
                    {isEditing ? (
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
                            >
                                {isSaving ? (
                                    <>Salvando...</>
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleEdit}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <PencilIcon className="w-5 h-5" />
                            Editar Perfil
                        </button>
                    )}

                    {/* Change Password Section */}
                    <div className="border-t pt-6">
                        {!isChangingPassword ? (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Alterar Senha
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">Alterar Senha</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                                    <input
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Digite sua senha atual"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Digite sua nova senha"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Confirme sua nova senha"
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-red-600 text-sm">{passwordError}</p>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={isSaving}
                                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {isSaving ? 'Alterando...' : 'Confirmar Alteração'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setOldPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                            setPasswordError('');
                                        }}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
