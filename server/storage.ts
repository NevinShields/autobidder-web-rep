import { formulas, leads, type Formula, type InsertFormula, type Lead, type InsertLead } from "@shared/schema";
import { nanoid } from "nanoid";

export interface IStorage {
  // Formula operations
  getFormula(id: number): Promise<Formula | undefined>;
  getFormulaByEmbedId(embedId: string): Promise<Formula | undefined>;
  getAllFormulas(): Promise<Formula[]>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<boolean>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByFormulaId(formulaId: number): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
}

export class MemStorage implements IStorage {
  private formulas: Map<number, Formula> = new Map();
  private leads: Map<number, Lead> = new Map();
  private currentFormulaId: number = 1;
  private currentLeadId: number = 1;

  constructor() {
    // Add a sample formula for demo purposes
    const sampleFormula: Formula = {
      id: 1,
      name: "Kitchen Remodel Pricing",
      title: "Kitchen Remodel Cost Calculator",
      variables: [
        {
          id: "squareFootage",
          name: "Square Footage",
          type: "number",
          unit: "sq ft"
        },
        {
          id: "materialQuality",
          name: "Material Quality",
          type: "select",
          options: [
            { label: "Basic", value: "basic", multiplier: 1.2 },
            { label: "Premium", value: "premium", multiplier: 1.5 },
            { label: "Luxury", value: "luxury", multiplier: 2.0 }
          ]
        },
        {
          id: "laborHours",
          name: "Labor Hours",
          type: "number",
          unit: "hours"
        }
      ],
      formula: "squareFootage * 25 + laborHours * 85 + materialQuality",
      styling: {
        primaryColor: "#1976D2",
        buttonStyle: "rounded",
        showPriceBreakdown: true,
        includeLedCapture: true
      },
      isActive: true,
      embedId: "abc123"
    };
    
    this.formulas.set(1, sampleFormula);
    this.currentFormulaId = 2;
  }

  // Formula operations
  async getFormula(id: number): Promise<Formula | undefined> {
    return this.formulas.get(id);
  }

  async getFormulaByEmbedId(embedId: string): Promise<Formula | undefined> {
    return Array.from(this.formulas.values()).find(formula => formula.embedId === embedId);
  }

  async getAllFormulas(): Promise<Formula[]> {
    return Array.from(this.formulas.values());
  }

  async createFormula(insertFormula: InsertFormula): Promise<Formula> {
    const id = this.currentFormulaId++;
    const embedId = nanoid(10);
    const formula: Formula = {
      ...insertFormula,
      id,
      embedId,
      isActive: insertFormula.isActive ?? true
    };
    this.formulas.set(id, formula);
    return formula;
  }

  async updateFormula(id: number, updateData: Partial<InsertFormula>): Promise<Formula | undefined> {
    const existing = this.formulas.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updateData };
    this.formulas.set(id, updated);
    return updated;
  }

  async deleteFormula(id: number): Promise<boolean> {
    return this.formulas.delete(id);
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadsByFormulaId(formulaId: number): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.formulaId === formulaId);
  }

  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.currentLeadId++;
    const lead: Lead = {
      ...insertLead,
      id,
      phone: insertLead.phone ?? null,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }
}

export const storage = new MemStorage();
