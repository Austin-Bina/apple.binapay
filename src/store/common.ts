import {createAsyncThunk as untypedCreateAsyncThunk} from '@reduxjs/toolkit';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import { Dispatch, State } from './main';

export const useTypedDispatch: () => Dispatch = useDispatch;
export const useTypedSelector: TypedUseSelectorHook<State> = useSelector;
export const createTypedAsyncThunk = untypedCreateAsyncThunk.withTypes<{
  state: State;
  dispatch: Dispatch;
}>();
