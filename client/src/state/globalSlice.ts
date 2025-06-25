
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GlobalState {
    viewMode: 'list' | 'grid';
    filters: Record<string, any>;
}

const initialState: GlobalState = {
    viewMode: 'list',
    filters: {},
};

const globalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
        setViewMode(state, action: PayloadAction<'list' | 'grid'>) {
            state.viewMode = action.payload;
        },
    },
});

export const { setViewMode } = globalSlice.actions;
export default globalSlice.reducer;