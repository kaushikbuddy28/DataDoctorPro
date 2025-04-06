import { users, type User, type InsertUser, type Dataset, type InsertDataset, type UpdateDataset } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Dataset operations
  getDataset(id: number): Promise<Dataset | undefined>;
  getDatasetsByUserId(userId: number): Promise<Dataset[]>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  updateDataset(id: number, updates: UpdateDataset): Promise<Dataset | undefined>;
  deleteDataset(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private datasets: Map<number, Dataset>;
  private userCurrentId: number;
  private datasetCurrentId: number;

  constructor() {
    this.users = new Map();
    this.datasets = new Map();
    this.userCurrentId = 1;
    this.datasetCurrentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Dataset operations
  async getDataset(id: number): Promise<Dataset | undefined> {
    return this.datasets.get(id);
  }

  async getDatasetsByUserId(userId: number): Promise<Dataset[]> {
    return Array.from(this.datasets.values()).filter(
      (dataset) => dataset.userId === userId,
    );
  }

  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const id = this.datasetCurrentId++;
    const dataset: Dataset = { 
      ...insertDataset,
      id,
      cleanedData: null,
      cleaningStats: null,
      isProcessed: false,
      savedProjectName: null
    };
    this.datasets.set(id, dataset);
    return dataset;
  }

  async updateDataset(id: number, updates: UpdateDataset): Promise<Dataset | undefined> {
    const dataset = this.datasets.get(id);
    if (!dataset) {
      return undefined;
    }

    const updatedDataset = { ...dataset, ...updates };
    this.datasets.set(id, updatedDataset);
    return updatedDataset;
  }

  async deleteDataset(id: number): Promise<boolean> {
    return this.datasets.delete(id);
  }
}

export const storage = new MemStorage();
