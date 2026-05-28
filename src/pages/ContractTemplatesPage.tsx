import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  IconButton, Tooltip, CircularProgress, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Tabs, Tab, Select,
  MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import {
  Add, Edit, Delete, PlayArrow, Code, Refresh, UploadFile, RocketLaunch,
} from '@mui/icons-material';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import SolEditor from '@/components/SolEditor';
import {
  contractTemplateAPI,
  deployedContractAPI,
  walletAPI,
  ContractTemplate,
  ContractTemplateParam,
  DeployedContract,
} from '@/lib/api';

// ── Sample template ───────────────────────────────────────────────────────────

const SAMPLE_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/presets/ERC721PresetMinterPauserAutoId.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract #FNFT is ERC721PresetMinterPauserAutoId, Ownable {
 using Counters for Counters.Counter;
 Counters.Counter private _tokenIdCounter;
 uint256 private _maxSupply = #MAXSUPPLY;
 
 constructor ()
 ERC721PresetMinterPauserAutoId(
 "#NAME",
 "#TOKEN",
 "#URI"
 )
 {}

 function mint(address _to) public virtual override {
 require(hasRole(MINTER_ROLE, _msgSender()), "Must have minter role to mint");
 require(totalSupply() <= _maxSupply, "Max Supply Has Been Reached");
 _mint(_to, _tokenIdCounter.current());
 _tokenIdCounter.increment();
 }

 /**
 * Prevents people from accidentally sending funds here.
 */
 receive () external payable {
 require(false, "This contract is for minting NFTs. It does not allow for receiving payments.");
 }
}`;

const SAMPLE_PARAMS: ContractTemplateParam[] = [
  { name: '#FNFT', description: 'Contract name', required: true },
  { name: '#MAXSUPPLY', description: 'Maximum token supply', required: true },
  { name: '#NAME', description: 'Token full name', required: true },
  { name: '#TOKEN', description: 'Token symbol', required: true },
  { name: '#URI', description: 'Base URI for metadata', required: true },
  { name: '#PREMINE', description: 'Pre-mine amount', required: true },
  { name: '#ERC20', description: 'ERC20 token address', required: true }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeContent(raw: string | number[] | null | undefined): string {
  if (!raw) return '';
  if (typeof raw === 'string') {
    // Try base64 decode
    try {
      const decoded = atob(raw);
      // Check if it looks like text (not binary)
      if (/^[\x20-\x7E\n\r\t]*$/.test(decoded)) return decoded;
    } catch {
      // not base64
    }
    return raw;
  }
  // byte array
  if (Array.isArray(raw)) {
    return new TextDecoder().decode(new Uint8Array(raw));
  }
  return String(raw);
}

// ── Editor dialog ─────────────────────────────────────────────────────────────

interface EditorDialogProps {
  open: boolean;
  template: ContractTemplate | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}

function EditorDialog({ open, template, onClose, onSaved }: EditorDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'evm' | 'wasm'>('evm');
  const [content, setContent] = useState('');
  const [wasmFile, setWasmFile] = useState<File | null>(null);
  const [params, setParams] = useState<ContractTemplateParam[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setType(template.type);
        setContent(decodeContent(template.template_content));
        setParams(template.parameters || []);
      } else {
        setName('FNFT1');
        setDescription('');
        setType('evm');
        setContent(SAMPLE_TEMPLATE);
        setParams(SAMPLE_PARAMS);
      }
      setWasmFile(null);
      setError(null);
    }
  }, [open, template]);

  const addParam = () =>
    setParams((p) => [...p, { name: '', description: '', required: false }]);

  const removeParam = (i: number) =>
    setParams((p) => p.filter((_, idx) => idx !== i));

  const updateParam = (i: number, field: keyof ContractTemplateParam, value: string | boolean) =>
    setParams((p) => p.map((param, idx) => (idx === i ? { ...param, [field]: value } : param)));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let finalContent = content;
      // For wasm type, if a file was selected encode it as base64
      if (type === 'wasm' && wasmFile) {
        const buf = await wasmFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        finalContent = btoa(binary);
      }
      const payload = { name, description, type, template_content: finalContent, parameters: params };
      if (template) {
        await contractTemplateAPI.update(template.id, payload);
      } else {
        await contractTemplateAPI.create(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{template ? 'Edit Template' : 'New Contract Template'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={(e) => setType(e.target.value as 'evm' | 'wasm')}>
              <MenuItem value="evm">EVM</MenuItem>
              <MenuItem value="wasm">WASM</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle2" gutterBottom>
          {type === 'wasm' ? 'WASM Binary' : 'Template Source (Solidity)'}
        </Typography>

        {type === 'wasm' ? (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: wasmFile ? 'success.main' : 'divider',
              borderRadius: 1,
              p: 3,
              mb: 2,
              textAlign: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <input
              ref={wasmInputRef}
              type="file"
              accept=".wasm"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setWasmFile(f);
                if (f) setContent(''); // clear text content when file selected
              }}
            />
            <UploadFile sx={{ fontSize: 40, color: wasmFile ? 'success.main' : 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color={wasmFile ? 'success.main' : 'text.secondary'} gutterBottom>
              {wasmFile ? wasmFile.name : (template?.template_content ? 'WASM already uploaded — select a new file to replace' : 'No file selected')}
            </Typography>
            <Button variant="outlined" size="small" onClick={() => wasmInputRef.current?.click()}>
              {wasmFile || template?.template_content ? 'Replace .wasm file' : 'Select .wasm file'}
            </Button>
            {wasmFile && (
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                {(wasmFile.size / 1024).toFixed(1)} KB
              </Typography>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <SolEditor value={content} onChange={setContent} minRows={20} />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2">Parameters</Typography>
          <Button size="small" startIcon={<Add />} onClick={addParam}>Add</Button>
        </Box>
        {params.map((p, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
            <TextField
              label="Placeholder"
              value={p.name}
              onChange={(e) => updateParam(i, 'name', e.target.value)}
              size="small"
              sx={{ width: 140 }}
              placeholder="#NAME"
            />
            <TextField
              label="Description"
              value={p.description}
              onChange={(e) => updateParam(i, 'description', e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Required</InputLabel>
              <Select
                value={p.required ? 'yes' : 'no'}
                label="Required"
                onChange={(e) => updateParam(i, 'required', e.target.value === 'yes')}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" color="error" onClick={() => removeParam(i)}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name}>
          {saving ? <CircularProgress size={18} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Simulate dialog ───────────────────────────────────────────────────────────

interface SimulateDialogProps {
  open: boolean;
  template: ContractTemplate | null;
  onClose: () => void;
}

function SimulateDialog({ open, template, onClose }: SimulateDialogProps) {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [rendered, setRendered] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && template) {
      const defaults: Record<string, string> = {};
      (template.parameters || []).forEach((p) => {
        defaults[p.name] = '';
      });
      setParamValues(defaults);
      setRendered('');
      setError(null);
    }
  }, [open, template]);

  const handleSimulate = async () => {
    if (!template) return;
    setLoading(true);
    setError(null);
    try {
      const res = await contractTemplateAPI.simulate(template.id, paramValues);
      setRendered(res.data.rendered);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Simulate: {template?.name}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="subtitle2" gutterBottom>Fill in parameter values</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {(template?.parameters || []).map((p) => (
            <TextField
              key={p.name}
              label={`${p.name}${p.required ? ' *' : ''}`}
              helperText={p.description}
              value={paramValues[p.name] || ''}
              onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
              size="small"
              sx={{ minWidth: 200 }}
            />
          ))}
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <PlayArrow />}
          onClick={handleSimulate}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Run Simulation
        </Button>

        {rendered && (
          <>
            <Typography variant="subtitle2" gutterBottom>Rendered Output</Typography>
            <SolEditor value={rendered} onChange={() => {}} minRows={18} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Create Contract dialog ────────────────────────────────────────────────────

interface CreateContractDialogProps {
  open: boolean;
  template: ContractTemplate | null;
  onClose: () => void;
  onCreated: (contract: DeployedContract) => void;
}

function CreateContractDialog({ open, template, onClose, onCreated }: CreateContractDialogProps) {
  const [contractName, setContractName] = useState('');
  const [chainId, setChainId] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [renderedSource, setRenderedSource] = useState('');
  const [rendered, setRendered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chains, setChains] = useState<import('@/lib/api').ChainDefinition[]>([]);
  const [walletMissing, setWalletMissing] = useState(false);
  const [, setLocation] = useLocation();

  const isWasm = template?.type === 'wasm';

  useEffect(() => {
    if (!open) return;
    // Load chains
    walletAPI.getChains().then((r) => setChains(r.data.chains || [])).catch(() => {});
    // Load user wallet for owner address
    walletAPI.getWallets().then((r) => {
      const wallets = r.data.data?.wallets || [];
      const targetType = isWasm ? 'COSMOS' : 'EVM';
      const match = wallets.find((w) => w.mpc_chain_type === targetType && w.status === 'active');
      if (match) {
        setOwnerAddress(match.public_address);
        setWalletMissing(false);
      } else {
        setOwnerAddress('');
        setWalletMissing(true);
      }
    }).catch(() => {});
  }, [open, isWasm]);

  useEffect(() => {
    if (open && template) {
      setContractName('');
      setChainId('');
      const defaults: Record<string, string> = {};
      (template.parameters || []).forEach((p) => { defaults[p.name] = ''; });
      setParamValues(defaults);
      setRenderedSource('');
      setRendered(false);
      setError(null);
    }
  }, [open, template]);

  const filteredChains = chains.filter((c) =>
    isWasm ? c.mpc_chain_type === 'COSMOS' : c.mpc_chain_type === 'EVM'
  );

  const handleRender = async (): Promise<string | null> => {
    if (!template) return null;
    setError(null);
    try {
      const res = await contractTemplateAPI.simulate(template.id, paramValues);
      setRenderedSource(res.data.rendered);
      setRendered(true);
      return res.data.rendered;
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
      return null;
    }
  };

  const requiredParamsFilled = (template?.parameters || [])
    .filter((p) => p.required)
    .every((p) => (paramValues[p.name] || '').trim() !== '');

  const canSave = !!contractName && !!chainId && !!ownerAddress && requiredParamsFilled;

  const handleSave = async () => {
    if (!template || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Always re-render to pick up latest param values
      const result = await handleRender();
      if (result === null) { setSaving(false); return; }
      const paramsUsed = Object.entries(paramValues).map(([name, value]) => ({ name, value }));
      const res = await deployedContractAPI.create({
        template_id: template.id,
        chain_id: chainId,
        owner_address: ownerAddress,
        contract_name: contractName,
        params_used: paramsUsed,
        rendered_source: result,
      });
      onCreated(res.data);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create Contract from: {template?.name}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {walletMissing && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <Button size="small" color="inherit" onClick={() => { onClose(); setLocation('/wallet'); }}>
                Go to Wallet
              </Button>
            }
          >
            No active {isWasm ? 'Cosmos' : 'EVM'} wallet found. Create one first.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Contract Name *"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 160 }}
          />
          <FormControl size="small" sx={{ flex: 1, minWidth: 160 }} required>
            <InputLabel>Chain *</InputLabel>
            <Select value={chainId} label="Chain *" onChange={(e) => setChainId(e.target.value)}>
              {filteredChains.map((c) => (
                <MenuItem key={c.chain_id} value={c.chain_id}>
                  {c.display_name} ({c.chain_id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Owner Address *"
            value={ownerAddress}
            size="small"
            sx={{ flex: 2, minWidth: 200 }}
            placeholder={isWasm ? 'cosmos1...' : '0x...'}
            helperText="Auto-populated from active wallet — read-only"
            InputProps={{ readOnly: true }}
          />
        </Box>

        {(template?.parameters || []).length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              {isWasm ? 'Instantiate Parameters (WASM)' : 'Template Parameters'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              {(template?.parameters || []).map((p) => (
                <TextField
                  key={p.name}
                  label={`${p.name}${p.required ? ' *' : ''}`}
                  helperText={p.description}
                  value={paramValues[p.name] || ''}
                  onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              ))}
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleRender}
              sx={{ mb: 2 }}
            >
              {isWasm ? 'Preview Params JSON' : 'Render Source'}
            </Button>
          </>
        )}

        {rendered && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              {isWasm ? 'Instantiate Params (JSON)' : 'Rendered Source — editable before saving'}
            </Typography>
            <SolEditor value={renderedSource} onChange={setRenderedSource} minRows={isWasm ? 8 : 18} />
          </>
        )}

        {!rendered && (template?.parameters || []).length === 0 && (
          <Alert severity="info">
            This template has no parameters. The source will be saved as-is.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !canSave}
          startIcon={saving ? <CircularProgress size={16} /> : <RocketLaunch />}
        >
          Save Contract
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContractTemplatesPage() {
  const { hasGlobalRole, hasRole } = useAuth();
  const isAdmin = hasGlobalRole('admin') || hasGlobalRole('owner');
  const isTenantAdmin = hasRole('tenant_admin');
  const canEdit = isAdmin || isTenantAdmin;

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractTemplate | null>(null);

  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simulateTarget, setSimulateTarget] = useState<ContractTemplate | null>(null);

  const [createContractOpen, setCreateContractOpen] = useState(false);
  const [createContractTemplate, setCreateContractTemplate] = useState<ContractTemplate | null>(null);

  const [tab, setTab] = useState(0);
  const [viewTemplate, setViewTemplate] = useState<ContractTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractTemplateAPI.list();
      setTemplates(res.data.templates || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await contractTemplateAPI.delete(id);
      load();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const openEditor = (t: ContractTemplate | null) => {
    setEditTarget(t);
    setEditorOpen(true);
  };

  const openSimulate = (t: ContractTemplate) => {
    setSimulateTarget(t);
    setSimulateOpen(true);
  };

  const openCreateContract = (t: ContractTemplate) => {
    setCreateContractTemplate(t);
    setCreateContractOpen(true);
  };

  const openView = (t: ContractTemplate) => {
    setViewTemplate(t);
    setTab(1);
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>Contract Templates</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={load}><Refresh /></IconButton>
            </Tooltip>
            {canEdit && (
              <Button variant="contained" startIcon={<Add />} onClick={() => openEditor(null)}>
                New Template
              </Button>
            )}
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Templates" />
          <Tab label="Editor" disabled={!viewTemplate} />
        </Tabs>

        {/* ── Tab 0: List ── */}
        {tab === 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Parameters</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No templates found
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => openView(t)}
                        >
                          {t.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={t.type.toUpperCase()} size="small" color={t.type === 'evm' ? 'primary' : 'secondary'} />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description || '—'}
                      </TableCell>
                      <TableCell>{(t.parameters || []).length}</TableCell>
                      <TableCell>
                        <Chip
                          label={t.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={t.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View / Edit source">
                          <IconButton size="small" onClick={() => openView(t)}><Code fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title="Simulate">
                          <IconButton size="small" color="success" onClick={() => openSimulate(t)}>
                            <PlayArrow fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canEdit && (
                          <Tooltip title="Create Contract">
                            <IconButton size="small" color="primary" onClick={() => openCreateContract(t)}>
                              <RocketLaunch fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(isAdmin || (!t.is_system_template && isTenantAdmin)) && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEditor(t)}><Edit fontSize="small" /></IconButton>
                            </Tooltip>
                            {(isAdmin || t.tenant_id) && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDelete(t.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ── Tab 1: Editor (read-only view + edit button) ── */}
        {tab === 1 && viewTemplate && (
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{viewTemplate.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewTemplate.description}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => openSimulate(viewTemplate)}
                  >
                    Simulate
                  </Button>
                  {(isAdmin || (!viewTemplate.is_system_template && isTenantAdmin)) && (
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => openEditor(viewTemplate)}
                    >
                      Edit
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={viewTemplate.type.toUpperCase()} color={viewTemplate.type === 'evm' ? 'primary' : 'secondary'} size="small" />
                <Chip label={viewTemplate.is_active ? 'Active' : 'Inactive'} color={viewTemplate.is_active ? 'success' : 'default'} size="small" />
                {!viewTemplate.tenant_id && <Chip label="System Default" color="warning" size="small" />}
              </Box>

              {(viewTemplate.parameters || []).length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Parameters</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {viewTemplate.parameters.map((p) => (
                      <Chip
                        key={p.name}
                        label={`${p.name}${p.required ? ' *' : ''}`}
                        size="small"
                        variant="outlined"
                        title={p.description}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography variant="subtitle2" gutterBottom>Source</Typography>
              {viewTemplate.type === 'wasm' ? (
                <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">
                    WASM binary — not displayable as text
                  </Typography>
                </Box>
              ) : (
                <SolEditor
                  value={decodeContent(viewTemplate.template_content) || ''}
                  onChange={() => {}}
                  minRows={20}
                />
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      <EditorDialog
        open={editorOpen}
        template={editTarget}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          load();
          if (editTarget) {
            // Refresh viewTemplate if we edited the currently viewed one
            contractTemplateAPI.get(editTarget.id).then((r) => setViewTemplate(r.data)).catch(() => {});
          }
        }}
      />

      <SimulateDialog
        open={simulateOpen}
        template={simulateTarget}
        onClose={() => setSimulateOpen(false)}
      />

      <CreateContractDialog
        open={createContractOpen}
        template={createContractTemplate}
        onClose={() => setCreateContractOpen(false)}
        onCreated={() => {}}
      />
    </DashboardLayout>
  );
}
