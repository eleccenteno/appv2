'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users, Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Lock,
  Mail, Phone, Car, Shield, UserCheck, UserX, Loader2, ArrowLeft
} from 'lucide-react';

interface EmployeeData {
  id: string;
  username: string;
  name: string;
  nombreCompleto?: string;
  email?: string;
  phone?: string;
  dni?: string;
  foto?: string;
  role: string;
  tipo?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  vehiculoMatricula?: string;
  activo: boolean;
  createdAt: string;
  _count?: { preventivos: number; tareasAsignadas: number };
  vehiculosAsignados?: { vehiculo: { marca: string; modelo: string; matricula: string } }[];
}

const TIPO_OPTIONS = ['Administrador', 'Encargado', 'Empleado', 'Servicio Tecnico', 'Mecanico'] as const;

const tipoBadgeConfig: Record<string, { className: string; label: string }> = {
  'Administrador': { className: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Administrador' },
  'Encargado': { className: 'bg-sky-100 text-sky-800 border-sky-200', label: 'Encargado' },
  'Empleado': { className: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Empleado' },
  'Servicio Tecnico': { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Servicio Técnico' },
  'Mecanico': { className: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Mecánico' },
};

function getRoleFromTipo(tipo: string): string {
  switch (tipo) {
    case 'Administrador': return 'admin';
    case 'Encargado': return 'encargado';
    case 'Mecanico': return 'mecanico';
    default: return 'empleado';
  }
}

interface FormData {
  name: string;
  nombreCompleto: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  dni: string;
  tipo: string;
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoMatricula: string;
}

const emptyForm: FormData = {
  name: '',
  nombreCompleto: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  dni: '',
  tipo: 'Empleado',
  vehiculoMarca: '',
  vehiculoModelo: '',
  vehiculoMatricula: '',
};

export default function UsuariosView() {
  const { currentUser, setCurrentView, goBack } = useAppStore();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'admin';

  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Alert dialog states
  const [toggleAlertOpen, setToggleAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [targetEmployee, setTargetEmployee] = useState<EmployeeData | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employees?stats=true');
      if (!res.ok) throw new Error('Error fetching employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los empleados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !searchTerm ||
      (emp.nombreCompleto || emp.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.dni || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === 'todos' || emp.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' ||
      (filterEstado === 'activo' && emp.activo) ||
      (filterEstado === 'inactivo' && !emp.activo);

    return matchesSearch && matchesTipo && matchesEstado;
  });

  const totalUsers = employees.length;
  const activeUsers = employees.filter(e => e.activo).length;
  const inactiveUsers = employees.filter(e => !e.activo).length;

  // Handle create
  const handleCreate = async () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast({ title: 'Error', description: 'Nombre, username y contraseña son requeridos', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: getRoleFromTipo(formData.tipo),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error creando empleado');
      }
      toast({ title: 'Éxito', description: 'Empleado creado exitosamente' });
      setCreateOpen(false);
      setFormData(emptyForm);
      fetchEmployees();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Error creando empleado', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editingEmployee) return;
    if (!formData.name || !formData.username) {
      toast({ title: 'Error', description: 'Nombre y username son requeridos', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, unknown> = {
        id: editingEmployee.id,
        name: formData.name,
        nombreCompleto: formData.nombreCompleto || null,
        username: formData.username,
        email: formData.email || null,
        phone: formData.phone || null,
        dni: formData.dni || null,
        role: getRoleFromTipo(formData.tipo),
        tipo: formData.tipo || null,
        vehiculoMarca: formData.vehiculoMarca || null,
        vehiculoModelo: formData.vehiculoModelo || null,
        vehiculoMatricula: formData.vehiculoMatricula || null,
      };
      // Only send password if changed
      if (formData.password && formData.password.trim() !== '') {
        body.password = formData.password;
      }
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error actualizando empleado');
      }
      toast({ title: 'Éxito', description: 'Empleado actualizado exitosamente' });
      setEditOpen(false);
      setEditingEmployee(null);
      setFormData(emptyForm);
      fetchEmployees();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Error actualizando empleado', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async () => {
    if (!targetEmployee) return;
    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetEmployee.id, activo: !targetEmployee.activo }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error cambiando estado');
      }
      toast({
        title: 'Éxito',
        description: targetEmployee.activo ? 'Empleado desactivado exitosamente' : 'Empleado activado exitosamente',
      });
      setToggleAlertOpen(false);
      setTargetEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Error cambiando estado', variant: 'destructive' });
    }
  };

  // Handle delete (soft delete / deactivate)
  const handleDelete = async () => {
    if (!targetEmployee) return;
    try {
      const res = await fetch(`/api/employees?id=${targetEmployee.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error eliminando empleado');
      }
      toast({ title: 'Éxito', description: 'Empleado desactivado exitosamente' });
      setDeleteAlertOpen(false);
      setTargetEmployee(null);
      fetchEmployees();
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Error eliminando empleado', variant: 'destructive' });
    }
  };

  // Open edit dialog with prefilled data
  const openEdit = (emp: EmployeeData) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      nombreCompleto: emp.nombreCompleto || '',
      username: emp.username,
      email: emp.email || '',
      password: '',
      phone: emp.phone || '',
      dni: emp.dni || '',
      tipo: emp.tipo || 'Empleado',
      vehiculoMarca: emp.vehiculoMarca || '',
      vehiculoModelo: emp.vehiculoModelo || '',
      vehiculoMatricula: emp.vehiculoMatricula || '',
    });
    setEditOpen(true);
  };

  const displayName = (emp: EmployeeData) => emp.nombreCompleto || emp.name;
  const initials = (emp: EmployeeData) => emp.name.charAt(0).toUpperCase();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="text-teal-600 hover:text-teal-800 hover:bg-teal-50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-teal-900 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Administra los empleados del sistema</p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setFormData(emptyForm)}>
                <Plus className="h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-teal-800">Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <UserForm formData={formData} setFormData={setFormData} onSave={handleCreate} saving={saving} isEdit={false} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Non-admin banner */}
      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Solo los administradores pueden gestionar usuarios. Puedes consultar la información pero no realizar cambios.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className="border-teal-100">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-teal-600" />
              <span className="text-2xl font-bold text-teal-800">{totalUsers}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-800">{activeUsers}</span>
            </div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card className="border-red-100">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UserX className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-700">{inactiveUsers}</span>
            </div>
            <p className="text-xs text-muted-foreground">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-teal-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, username, DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-teal-200 focus:border-teal-400"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-48 border-teal-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPO_OPTIONS.map(t => (
                  <SelectItem key={t} value={t}>{tipoBadgeConfig[t]?.label || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-36 border-teal-200">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          <span className="ml-3 text-muted-foreground">Cargando usuarios...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="border-teal-100">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No se encontraron usuarios</p>
            <p className="text-muted-foreground text-sm mt-1">Ajusta los filtros de búsqueda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card className="border-teal-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-teal-50/80 border-b border-teal-100">
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Estado</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Nombre</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Username</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Email</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Teléfono</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Tipo</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">DNI</th>
                      <th className="text-left text-xs font-semibold text-teal-700 px-4 py-3">Vehículo</th>
                      {isAdmin && <th className="text-right text-xs font-semibold text-teal-700 px-4 py-3">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-teal-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${emp.activo ? 'bg-emerald-500' : 'bg-red-500'}`} title={emp.activo ? 'Activo' : 'Inactivo'} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {initials(emp)}
                            </div>
                            <span className="font-medium text-sm text-gray-900">{displayName(emp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={tipoBadgeConfig[emp.tipo || '']?.className || 'bg-gray-100 text-gray-800 border-gray-200'}>
                            {tipoBadgeConfig[emp.tipo || '']?.label || emp.tipo || '—'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{emp.dni || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {emp.vehiculoMarca ? (
                            <span className="flex items-center gap-1">
                              <Car className="h-3.5 w-3.5 text-gray-400" />
                              {emp.vehiculoMarca} {emp.vehiculoModelo}
                              <span className="text-xs text-gray-400">({emp.vehiculoMatricula})</span>
                            </span>
                          ) : '—'}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                                onClick={() => openEdit(emp)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${emp.activo ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                                onClick={() => { setTargetEmployee(emp); setToggleAlertOpen(true); }}
                                title={emp.activo ? 'Desactivar' : 'Activar'}
                              >
                                {emp.activo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => { setTargetEmployee(emp); setDeleteAlertOpen(true); }}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredEmployees.map((emp) => (
              <Card key={emp.id} className="border-teal-100 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-base font-semibold">
                        {initials(emp)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${emp.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{displayName(emp)}</h3>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${tipoBadgeConfig[emp.tipo || '']?.className || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {tipoBadgeConfig[emp.tipo || '']?.label || emp.tipo || '—'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">@{emp.username}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        {emp.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {emp.email}
                          </span>
                        )}
                        {emp.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {emp.phone}
                          </span>
                        )}
                        {emp.dni && (
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-gray-400" />
                            {emp.dni}
                          </span>
                        )}
                      </div>

                      {emp.vehiculoMarca && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Car className="h-3 w-3 text-gray-400" />
                          {emp.vehiculoMarca} {emp.vehiculoModelo} ({emp.vehiculoMatricula})
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600 hover:text-teal-800 hover:bg-teal-50"
                          onClick={() => openEdit(emp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${emp.activo ? 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                          onClick={() => { setTargetEmployee(emp); setToggleAlertOpen(true); }}
                        >
                          {emp.activo ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => { setTargetEmployee(emp); setDeleteAlertOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-800">Editar Usuario</DialogTitle>
          </DialogHeader>
          <UserForm formData={formData} setFormData={setFormData} onSave={handleEdit} saving={saving} isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Toggle Active Alert */}
      <AlertDialog open={toggleAlertOpen} onOpenChange={setToggleAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetEmployee?.activo ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetEmployee?.activo
                ? `¿Estás seguro de desactivar a ${targetEmployee ? displayName(targetEmployee) : ''}? El usuario no podrá acceder a la aplicación.`
                : `¿Estás seguro de activar a ${targetEmployee ? displayName(targetEmployee) : ''}? El usuario volverá a tener acceso a la aplicación.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTargetEmployee(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={targetEmployee?.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {targetEmployee?.activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar a {targetEmployee ? displayName(targetEmployee) : ''}? El usuario será desactivado y no podrá acceder a la aplicación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTargetEmployee(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================
// User Form Component
// ============================
interface UserFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}

function UserForm({ formData, setFormData, onSave, saving, isEdit }: UserFormProps) {
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Nombre corto"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombreCompleto" className="text-sm font-medium text-gray-700">Nombre Completo</Label>
          <Input
            id="nombreCompleto"
            value={formData.nombreCompleto}
            onChange={(e) => updateField('nombreCompleto', e.target.value)}
            placeholder="Nombre y apellidos completos"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username *</Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => updateField('username', e.target.value)}
            placeholder="Nombre de usuario"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            {isEdit ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
          </Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder={isEdit ? '••••••••' : 'Contraseña'}
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="600000000"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dni" className="text-sm font-medium text-gray-700">DNI</Label>
          <Input
            id="dni"
            value={formData.dni}
            onChange={(e) => updateField('dni', e.target.value)}
            placeholder="12345678A"
            className="border-teal-200 focus:border-teal-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo" className="text-sm font-medium text-gray-700">Tipo</Label>
          <Select value={formData.tipo} onValueChange={(val) => updateField('tipo', val)}>
            <SelectTrigger className="border-teal-200">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.map(t => (
                <SelectItem key={t} value={t}>{tipoBadgeConfig[t]?.label || t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="border-t border-teal-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Car className="h-4 w-4 text-teal-600" />
          Vehículo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vehiculoMarca" className="text-xs text-gray-600">Marca</Label>
            <Input
              id="vehiculoMarca"
              value={formData.vehiculoMarca}
              onChange={(e) => updateField('vehiculoMarca', e.target.value)}
              placeholder="Nissan"
              className="border-teal-200 focus:border-teal-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehiculoModelo" className="text-xs text-gray-600">Modelo</Label>
            <Input
              id="vehiculoModelo"
              value={formData.vehiculoModelo}
              onChange={(e) => updateField('vehiculoModelo', e.target.value)}
              placeholder="X-Trail"
              className="border-teal-200 focus:border-teal-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehiculoMatricula" className="text-xs text-gray-600">Matrícula</Label>
            <Input
              id="vehiculoMatricula"
              value={formData.vehiculoMatricula}
              onChange={(e) => updateField('vehiculoMatricula', e.target.value)}
              placeholder="1234ABC"
              className="border-teal-200 focus:border-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Role info */}
      <div className="bg-teal-50 rounded-lg p-3 flex items-center gap-2 text-sm text-teal-700">
        <Shield className="h-4 w-4 flex-shrink-0" />
        <span>Rol asignado: <strong>{getRoleFromTipo(formData.tipo) === 'admin' ? 'Administrador' : getRoleFromTipo(formData.tipo) === 'encargado' ? 'Encargado' : getRoleFromTipo(formData.tipo) === 'mecanico' ? 'Mecánico' : 'Empleado'}</strong> (se asigna automáticamente según el tipo)</span>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => {}} className="border-teal-200">
          Cancelar
        </Button>
        <Button onClick={onSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </div>
    </div>
  );
}
