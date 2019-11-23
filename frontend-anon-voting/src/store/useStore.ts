import { useContext } from 'react';
import RootStore, { storeContext } from './index';

export const useStore = <Store>(storeSelector: (rootStore: RootStore) => Store) => {
    const value = useContext(storeContext);
    if (!value) {
        throw new Error(`storeContext does not have any value`);
    }
    const store = storeSelector(value);
    return store;
};
