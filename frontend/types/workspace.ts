export interface WorkspaceProject {
  id: string;
  name: string;
  canvasConfig: {
    width: number;
    height: number;
    backgroundType: "color" | "gradient" | "image" | "transparent";
    backgroundColor: string;
    backgroundGradient: {
      color1: string;
      color2: string;
      type: "linear" | "radial";
    };
    backgroundImage: string | null;
  };
  canvasData: string; // Fabric JSON string representation
  batchImages: string[];
  thumbnail: string | null; // Base64 JPEG thumbnail of the canvas design
  folderId: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  createdAt: string;
}
