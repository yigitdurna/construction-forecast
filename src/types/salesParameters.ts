import { ParameterSource } from './index';

export interface SalesParameter {
  id: string;
  label: string;
  labelTR: string;
  description: string;
  unit: 'TL/m²' | '%' | 'x';
  defaultValue: number;
  userValue: number | null;
  effectiveValue: number;
  source: ParameterSource;
  editable: boolean;
  min: number;
  max: number;
}

export interface SalesParametersState {
  parameters: SalesParameter[];
}
