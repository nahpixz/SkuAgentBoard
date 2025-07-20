import { ModalOverlay } from "@/components/panel/modal-overlay"
import { DB } from "@/entrypoints/panel/db";
import { createT } from "@/lib/utils";

const State = {
  pendingItem: [] as DB.skuItem[],
  running: false,
}

export const skuProcessStore = createT<typeof State>()((set,get) =>({
    ...State,
    init: (pendingItem:DB.skuItem[]) => set({pendingItem}),
    clear: () => set({pendingItem:[]}),
}));


export const skuProcessBoard = ()=>{
    const {pendingItem,clear} = skuProcessStore()
  return (
    <ModalOverlay isOpen={pendingItem.length>0} onClose={clear}>
        <></>
    </ModalOverlay>
  )
}
