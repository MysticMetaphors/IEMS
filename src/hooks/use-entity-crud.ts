import { useState } from "react";


const DRAWER_CLOSE_DELAY_MS = 300;

type DrawerState<TItem, TMode extends string> = {
  open: boolean;
  mode: TMode;
  item: TItem | null;
};

type DeleteState<TItem> = {
  open: boolean;
  item: TItem | null;
};

type Config<TItem, TMode extends string, TCreate, TUpdate> = {
  entity: string;
  initialMode: TMode;
  viewMode: TMode;
  list: {
    reload: () => unknown;
    reset: () => unknown;
    setPage: (page: number) => void;
  };
  create: (input: TCreate) => Promise<void>;
  update: (input: TUpdate) => Promise<TItem | null>;
  remove: (item: TItem) => Promise<void>;
};

export function useEntityCrud<TItem, TMode extends string, TCreate, TUpdate>({ entity, initialMode, viewMode, list, create, update, remove,}: 
  Config<TItem, TMode, TCreate, TUpdate>) {
  const [drawer, setDrawer] = useState<DrawerState<TItem, TMode>>({
    open: false,
    mode: initialMode,
    item: null,
  });
  const [deleteState, setDeleteState] = useState<DeleteState<TItem>>({
    open: false,
    item: null,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showDrawer = (mode: TMode, item: TItem | null = null) =>
    setDrawer({ open: true, mode, item });

  const switchMode = (mode: TMode) => {
    setSaveError(null);
    setDrawer((prev) => ({ ...prev, mode }));
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawer((prev) => ({ ...prev, open: false }));
  };

  const requestDelete = (item: TItem | null) => {
    if (!item) return;

    setDeleteError(null);
    setDrawer((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setDeleteState({ open: true, item });
    }, DRAWER_CLOSE_DELAY_MS);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteState((prev) => ({ ...prev, open: false }));
  };

  // ---- CRUD handlers ----
  const handleCreate = async (input: TCreate) => {
    try {
      setSaving(true);
      setSaveError(null);

      await create(input);

      list.reset();
      setDrawer((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error(`Failed to create ${entity}:`, err);
      setSaveError(`Unable to save the ${entity}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (input: TUpdate) => {
    try {
      setSaving(true);
      setSaveError(null);

      const updated = await update(input);
      list.reload();

      setDrawer({ open: true, mode: viewMode, item: updated });
    } catch (err) {
      console.error(`Failed to update ${entity}:`, err);
      setSaveError(`Unable to update the ${entity}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const item = deleteState.item;
    if (!item) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await remove(item);

      list.setPage(1);
      list.reload();
      setDeleteState((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error(`Failed to delete ${entity}:`, err);
      setDeleteError(`Unable to delete the ${entity}. Please try again.`);
    } finally {
      setDeleting(false);
    }
  };

  return {
    drawer,
    showDrawer,
    switchMode,
    closeDrawer,
    saving,
    saveError,
    setSaveError,
    deleteState,
    deleting,
    deleteError,
    requestDelete,
    closeDeleteModal,
    handleCreate,
    handleUpdate,
    handleConfirmDelete,
  };
}