
import { db, USE_CLOUD_DB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, query, getDocs } from 'firebase/firestore';
import { Activity, User, StandardDefinition, AppSettings, StandardType } from '../types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from '../constants';

// Collection Names
const COLL_ACTIVITIES = 'activities';
const COLL_USERS = 'users';
const COLL_STANDARDS = 'standards';
const COLL_SETTINGS = 'settings';
const DOC_SETTINGS_GENERAL = 'general';

class DataService {
  
  // --- SUBSCRIPTIONS (REAL-TIME UPDATES) ---
  
  subscribeToActivities(onUpdate: (data: Activity[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_ACTIVITIES));
      return onSnapshot(q, 
        (querySnapshot) => {
          const activities: Activity[] = [];
          querySnapshot.forEach((doc) => {
            activities.push({ ...doc.data(), id: doc.id } as Activity);
          });
          onUpdate(activities);
        },
        (error) => {
          console.error("Firestore Error (Activities):", error);
          if (onError) onError(error);
        }
      );
    } else {
      // Local Mode: Listen to custom event for reactivity
      const load = () => {
        const saved = localStorage.getItem('app_activities');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate(MOCK_ACTIVITIES_GERENCIA);
        }
      };
      
      load(); // Initial load
      
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToUsers(onUpdate: (data: User[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_USERS));
      return onSnapshot(q, 
        (querySnapshot) => {
          const users: User[] = [];
          querySnapshot.forEach((doc) => {
            users.push({ ...doc.data(), id: doc.id } as User);
          });
          onUpdate(users);
        },
        (error) => {
          if (onError) onError(error);
        }
      );
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_users');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate(MOCK_USERS);
        }
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  // Nueva suscripción para Normas
  subscribeToStandards(onUpdate: (data: StandardDefinition[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_STANDARDS));
      return onSnapshot(q, (snapshot) => {
        const stds: StandardDefinition[] = [];
        snapshot.forEach(doc => stds.push({ ...doc.data(), id: doc.id } as StandardDefinition));
        onUpdate(stds);
      });
    } else {
      // Local mock defaults
      onUpdate([]); 
      return () => {};
    }
  }

  // Nueva suscripción para Configuración (Logo)
  subscribeToSettings(onUpdate: (data: AppSettings) => void) {
    if (USE_CLOUD_DB && db) {
      return onSnapshot(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), (doc) => {
        if (doc.exists()) {
          onUpdate(doc.data() as AppSettings);
        } else {
          onUpdate({ companyLogo: null });
        }
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('company_logo');
        onUpdate({ companyLogo: saved || null });
      };
      load();
      // We can reuse the same event or a specific one, reusing simple for now
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  // --- ACTIONS ---

  async addActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      try {
        const { id, ...data } = activity; 
        const sanitized = this.cleanData(data);
        await setDoc(doc(db, COLL_ACTIVITIES, activity.id), sanitized);
      } catch (error) {
        console.error("Error adding activity:", error);
        throw error;
      }
    } else {
      const current = this.getLocalActivities();
      const updated = [...current, activity];
      this.saveLocalActivities(updated);
    }
  }

  async updateActivity(activity: Activity) {
    if (USE_CLOUD_DB && db) {
      try {
        const { id, ...data } = activity;
        const sanitized = this.cleanData(data);
        const docRef = doc(db, COLL_ACTIVITIES, id);
        await updateDoc(docRef, sanitized);
      } catch (error) {
        console.error("Error updating activity:", error);
        throw error;
      }
    } else {
      const current = this.getLocalActivities();
      const updated = current.map(a => a.id === activity.id ? activity : a);
      this.saveLocalActivities(updated);
    }
  }

  async deleteActivity(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_ACTIVITIES, id));
    } else {
      const current = this.getLocalActivities();
      const updated = current.filter(a => a.id !== id);
      this.saveLocalActivities(updated);
    }
  }

  // --- USERS ACTIONS ---
  async addUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      const sanitized = this.cleanData(data);
      await setDoc(doc(db, COLL_USERS, user.id), sanitized);
    } else {
      const current = this.getLocalUsers();
      const updated = [...current, user];
      this.saveLocalUsers(updated);
    }
  }

  async updateUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      const sanitized = this.cleanData(data);
      const docRef = doc(db, COLL_USERS, id);
      await updateDoc(docRef, sanitized);
    } else {
      const current = this.getLocalUsers();
      const updated = current.map(u => u.id === user.id ? user : u);
      this.saveLocalUsers(updated);
    }
  }

  async deleteUser(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_USERS, id));
    } else {
      const current = this.getLocalUsers();
      const updated = current.filter(u => u.id !== id);
      this.saveLocalUsers(updated);
    }
  }

  // --- STANDARDS ACTIONS ---
  async updateStandard(std: StandardDefinition) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = std;
      const sanitized = this.cleanData(data);
      await setDoc(doc(db, COLL_STANDARDS, id), sanitized);
    }
  }

  // --- SETTINGS ACTIONS ---
  async updateSettings(settings: AppSettings) {
    if (USE_CLOUD_DB && db) {
      const sanitized = this.cleanData(settings);
      await setDoc(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), sanitized);
    } else {
      if (settings.companyLogo) {
        localStorage.setItem('company_logo', settings.companyLogo);
      } else {
        localStorage.removeItem('company_logo');
      }
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  // --- HELPER: CLEAN DATA FOR FIRESTORE (Remove Undefined) ---
  private cleanData(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanData(item));
    } else if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined) {
          newObj[key] = null; // Convert undefined to null for Firestore
        } else {
          newObj[key] = this.cleanData(value);
        }
      });
      return newObj;
    }
    return obj;
  }

  // --- LOCAL STORAGE HELPERS (Internal) ---
  private getLocalActivities(): Activity[] {
    const s = localStorage.getItem('app_activities');
    return s ? JSON.parse(s) : MOCK_ACTIVITIES_GERENCIA;
  }

  private saveLocalActivities(data: Activity[]) {
    localStorage.setItem('app_activities', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  private getLocalUsers(): User[] {
    const s = localStorage.getItem('app_users');
    return s ? JSON.parse(s) : MOCK_USERS;
  }

  private saveLocalUsers(data: User[]) {
    localStorage.setItem('app_users', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  // --- SEED DATA ---
  public async seedInitialData() {
    if (!USE_CLOUD_DB || !db) throw new Error("No hay conexión a la Nube");
    
    console.log("Iniciando carga de datos masiva...");
    const batchPromises = [];

    // Seed Activities
    for (const act of MOCK_ACTIVITIES_GERENCIA) {
       const { id, ...data } = act;
       batchPromises.push(setDoc(doc(db, COLL_ACTIVITIES, id), this.cleanData(data)));
    }

    // Seed Users
    for (const user of MOCK_USERS) {
       const { id, ...data } = user;
       batchPromises.push(setDoc(doc(db, COLL_USERS, id), this.cleanData(data)));
    }

    // Seed Default Standards Definitions
    const defaultStandards: StandardDefinition[] = [
      { id: 'std-iso', type: StandardType.ISO9001, description: 'Norma Internacional de Sistemas de Gestión de Calidad.', objective: 'Aumentar la satisfacción del cliente.', certifyingBody: 'ICONTEC', comments: [] },
      { id: 'std-sst', type: StandardType.SGSST, description: 'Sistema de Gestión de Seguridad y Salud en el Trabajo.', objective: 'Prevenir lesiones y deterioro de la salud.', certifyingBody: 'ARL / MinTrabajo', comments: [] },
      { id: 'std-fsc', type: StandardType.FSC, description: 'Certificación de manejo forestal responsable.', objective: 'Garantizar la trazabilidad de la madera.', certifyingBody: 'FSC International', comments: [] }
    ];

    for (const std of defaultStandards) {
      batchPromises.push(setDoc(doc(db, COLL_STANDARDS, std.id), this.cleanData(std)));
    }

    await Promise.all(batchPromises);
    console.log("¡Carga completada!");
  }
}

export const dataService = new DataService();
