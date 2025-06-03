import { ModelCtor } from "sequelize";
import { Database } from "../Database.js";
import { Styles } from "../models/Styles.js";

class StyleService {
  static #instance: StyleService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): StyleService {
    if (!StyleService.#instance) {
      StyleService.#instance = new StyleService();
    }

    return StyleService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(Styles.name);
  }

  public async getStyles(filter: { type: 'tone' | 'style' }): Promise<any[]> {
    try {
      if (!this.model) {
        throw new Error("Style model is not initialized.");
      }
      return (await this.model.findAll({
        where: {
          type: filter.type
        }
      })).map((style: any) => style.get({ plain: true }));
    } catch (error) {
      console.error("Error fetching styles:", error);
      return [];
    }
  }


}

const service = StyleService.instance;
export { service as StyleService };


