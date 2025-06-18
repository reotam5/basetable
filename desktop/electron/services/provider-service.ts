import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';
import { api } from '../helpers/axios-api.js';

export interface ProviderModel {
  name: string;
  key: string;
  description: string;
  capabilities: {
    function_calling: boolean;
    streaming: boolean;
  };
  limits: {
    context_window: number;
    max_output_tokens: number;
  };
  pricing: {
    prompt_token_price: number;
    completion_token_price: number;
    currency: string;
    unit: string;
  };
}

export interface Provider {
  id: string;
  name: string;
  base_url: string;
  status: string;
  models: Record<string, ProviderModel>;
  endpoints: {
    chat: {
      name: string;
      path: string;
      status: string;
      health: string;
      last_health_check: string;
    };
  };
  request_template: string;
  response_template: string;
}

export interface ProvidersResponse {
  providers: Provider[];
}

@service
class ProviderService {

  @event('provider.getAll', 'handle')
  public async getProviders(): Promise<Provider[]> {
    try {
      const response = await api.get<ProvidersResponse>('/v1/providers');
      return response.data.providers;
    } catch (error) {
      Logger.error("Error fetching remote providers:", error);
      return [];
    }
  }

  @event('provider.getModels', 'handle')
  public async getRemoteModels() {
    try {
      const providers = await this.getProviders();
      const remoteModels = [];

      for (const provider of providers) {
        for (const [modelKey, model] of Object.entries(provider.models)) {
          remoteModels.push({
            display_name: model.name,
            description: model.description,
            provider: provider.name,
            model: modelKey,
            model_path: '', // Not needed for remote models
            config: {
              provider_id: provider.id,
              base_url: provider.base_url,
              model: modelKey,
              capabilities: model.capabilities,
              limits: model.limits,
              pricing: model.pricing,
              endpoints: provider.endpoints,
              request_template: provider.request_template,
              response_template: provider.response_template
            },
            is_default: false,
            type: 'remote'
          });
        }
      }

      return remoteModels;
    } catch (error) {
      Logger.error("Error fetching remote models:", error);
      return [];
    }
  }
}

const instance = new ProviderService();
export { instance as ProviderService };