import Style from "../db/models/style.model.js";
import { event, service } from "../helpers/decorators.js";

@service
export class StyleService {

  @event('style.getByType', 'handle')
  public async getStylesByType(type: 'tone' | 'style'): Promise<any[]> {
    try {
      const styles = await Style.findAll({
        where: { type }
      });
      return styles.map(style => style.get({ plain: true }));
    } catch (error) {
      console.error("Error fetching styles by type:", error);
      return [];
    }
  }

  @event('style.getTones', 'handle')
  public async getTones(): Promise<any[]> {
    return this.getStylesByType('tone');
  }

  @event('style.getStyles', 'handle')
  public async getStylesOnly(): Promise<any[]> {
    return this.getStylesByType('style');
  }
}
