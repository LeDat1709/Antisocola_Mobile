import { apiClient } from './api';

export interface Brand {
  brandId: number;
  brandName: string;
  isActive: boolean;
}

export interface PrinterModel {
  modelId: number;
  modelName: string;
  brandId: number;
  defaultPaperSizes: string;
  defaultColorPrinting: boolean;
  defaultDuplexPrinting: boolean;
  isActive: boolean;
}

export interface Campus {
  campusId: number;
  campusCode: string;
  campusName: string;
  isActive: boolean;
}

export interface Building {
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  campusId: number;
  isActive: boolean;
}

export interface Room {
  roomId: number;
  roomNumber: string;
  roomType: string;
  capacity: number;
  buildingId: number;
  isActive: boolean;
}

export const referenceService = {
  /**
   * GET /api/reference/brands
   */
  async getBrands(): Promise<Brand[]> {
    const response = await apiClient.get<{ data: Brand[] }>('/reference/brands');
    return response.data.data;
  },

  /**
   * GET /api/reference/models?brandId=X
   */
  async getModelsByBrand(brandId: number): Promise<PrinterModel[]> {
    const response = await apiClient.get<{ data: PrinterModel[] }>(`/reference/models?brandId=${brandId}`);
    return response.data.data;
  },

  /**
   * GET /api/reference/campuses
   */
  async getCampuses(): Promise<Campus[]> {
    const response = await apiClient.get<{ data: Campus[] }>('/reference/campuses');
    return response.data.data;
  },

  /**
   * GET /api/reference/buildings?campusId=X
   */
  async getBuildingsByCampus(campusId: number): Promise<Building[]> {
    const response = await apiClient.get<{ data: Building[] }>(`/reference/buildings?campusId=${campusId}`);
    return response.data.data;
  },

  /**
   * GET /api/reference/rooms?buildingId=X
   */
  async getRoomsByBuilding(buildingId: number): Promise<Room[]> {
    const response = await apiClient.get<{ data: Room[] }>(`/reference/rooms?buildingId=${buildingId}`);
    return response.data.data;
  },
};
