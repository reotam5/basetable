import { backend } from "../backend.js";
import { navigate } from "./navigate.js";

export enum Screen {
  PRE_LOGIN_LOADING = 'PRE_LOGIN_LOADING',
  LOGIN = 'LOGIN',
  POST_LOGIN_LOADING = 'POST_LOGIN_LOADING',
  MODEL_DOWNLOAD = 'MODEL_DOWNLOAD',
  POST_MODEL_DOWNLOAD_LOADING = 'POST_MODEL_DOWNLOAD_LOADING',
  APP = 'APP',
}

class ScreenManager {
  private currentScreen: Screen = Screen.PRE_LOGIN_LOADING;
  private listeners: Array<(screen: Screen) => void> = [];

  onScreenChange(callback: (screen: Screen) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    }
  }

  notifyListners() {
    for (const listener of this.listeners) {
      listener(this.currentScreen);
    }
  }

  setScreen(screen: Screen) {
    this.currentScreen = screen;
    this.showScreen(screen);
    this.notifyListners();
  }

  showScreen(screen: Screen) {
    switch (screen) {
      case Screen.PRE_LOGIN_LOADING:
        navigate('/')
        backend.getMainWindow()?.setWindowPosition({
          height: 450,
          width: 400,
          center: true,
          resizable: false,
          animated: false
        })
        break;
      case Screen.LOGIN:
        navigate('/signin');
        backend.getMainWindow()?.setWindowPosition({
          height: 600,
          width: 500,
          center: true,
          resizable: false,
          animated: true
        })
        break;
      case Screen.POST_LOGIN_LOADING:
        navigate('/loading/post-login');
        backend.getMainWindow()?.setWindowPosition({
          height: 450,
          width: 400,
          center: true,
          resizable: false,
          animated: true
        })
        break;
      case Screen.MODEL_DOWNLOAD:
        navigate('/model-download');
        backend.getMainWindow()?.setWindowPosition({
          height: 800,
          width: 1200,
          center: true,
          resizable: false,
          animated: true
        })
        break;
      case Screen.POST_MODEL_DOWNLOAD_LOADING:
        navigate('/loading/model-download');
        backend.getMainWindow()?.setWindowPosition({
          height: 450,
          width: 400,
          center: true,
          resizable: false,
          animated: true
        })
        break;
      case Screen.APP:
        navigate('/chats');
        backend.getMainWindow()?.restore();
        break;
      default:
        throw new Error(`Unknown screen: ${screen}`);
    }
  }

  getCurrentScreen(): Screen {
    return this.currentScreen;
  }
}

const screenManager = new ScreenManager();
export { screenManager };
