
import { db, USE_CLOUD_DB } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, deleteDoc, doc, setDoc, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { Activity, User, StandardDefinition, AppSettings, StandardType, Notification, UserRole, Plant } from '../types';
import { MOCK_ACTIVITIES_GERENCIA, MOCK_USERS } from '../constants';

const COLL_ACTIVITIES = 'activities';
const COLL_USERS = 'users';
const COLL_STANDARDS = 'standards';
const COLL_SETTINGS = 'settings';
const COLL_NOTIFICATIONS = 'notifications';
const COLL_PLANTS = 'plants';
const DOC_SETTINGS_GENERAL = 'general';

class DataService {
  
  private cleanPlantIds(pids: string[] | undefined): string[] {
    if (!pids || !Array.isArray(pids)) return ['MOSQUERA'];
    
    // Normalización agresiva: Trim, Uppercase y mapeo de variaciones de Mosquera
    const cleaned = pids
      .map(id => String(id || '').trim().toUpperCase())
      .map(id => (id === 'PLT-MOSQUERA' || id === 'MOSQUERA') ? 'MOSQUERA' : id)
      .filter(id => id !== '');
    
    // Requisito: Siempre debe estar Mosquera (Matriz)
    if (!cleaned.includes('MOSQUERA')) cleaned.push('MOSQUERA');
    
    // Eliminar duplicados reales
    return Array.from(new Set(cleaned));
  }

  subscribeToActivities(onUpdate: (data: Activity[]) => void, onError?: (error: any) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_ACTIVITIES));
      return onSnapshot(q, 
        (querySnapshot) => {
          const activities: Activity[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Activity;
            activities.push({ 
              ...data, 
              id: doc.id, 
              plantIds: this.cleanPlantIds(data.plantIds) 
            } as Activity);
          });
          onUpdate(activities);
        },
        (error) => {
          console.error("Firestore Error (Activities):", error);
          if (onError) onError(error);
        }
      );
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_activities');
        if (saved) {
          const parsed = JSON.parse(saved).map((a: any) => ({ 
            ...a, 
            plantIds: this.cleanPlantIds(a.plantIds) 
          }));
          onUpdate(parsed);
        } else {
          onUpdate(MOCK_ACTIVITIES_GERENCIA.map(a => ({ ...a, plantIds: ['MOSQUERA'] })));
        }
      };
      load();
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

  subscribeToNotifications(userId: string, onUpdate: (data: Notification[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(
        collection(db, COLL_NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(50)
      );
      return onSnapshot(q, (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach(doc => notifs.push({ ...doc.data(), id: doc.id } as Notification));
        onUpdate(notifs);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem(`notifs_${userId}`);
        onUpdate(saved ? JSON.parse(saved) : []);
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToStandards(onUpdate: (data: StandardDefinition[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_STANDARDS));
      return onSnapshot(q, (snapshot) => {
        const stds: StandardDefinition[] = [];
        snapshot.forEach(doc => stds.push({ ...doc.data(), id: doc.id } as StandardDefinition));
        stds.sort((a, b) => a.type.localeCompare(b.type));
        onUpdate(stds);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_standards');
        if (saved) {
          onUpdate(JSON.parse(saved));
        } else {
          onUpdate([]);
        }
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  subscribeToPlants(onUpdate: (data: Plant[]) => void) {
    if (USE_CLOUD_DB && db) {
      const q = query(collection(db, COLL_PLANTS));
      return onSnapshot(q, (snapshot) => {
        const plants: Plant[] = [];
        snapshot.forEach(doc => plants.push({ ...doc.data(), id: doc.id } as Plant));
        plants.sort((a, b) => {
          if (a.isMain) return -1;
          if (b.isMain) return 1;
          return a.name.localeCompare(b.name);
        });
        onUpdate(plants);
      });
    } else {
      const load = () => {
        const saved = localStorage.getItem('app_plants');
        let plants = saved ? JSON.parse(saved) : [];
        plants.sort((a: Plant, b: Plant) => {
          if (a.isMain) return -1;
          if (b.isMain) return 1;
          return a.name.localeCompare(b.name);
        });
        onUpdate(plants);
      };
      load();
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

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
      const listener = () => load();
      window.addEventListener('local-data-changed', listener);
      return () => window.removeEventListener('local-data-changed', listener);
    }
  }

  async createNotification(notif: Omit<Notification, 'id'>) {
    const usersSnapshot = await this.getUsersOnce();
    const targetUser = usersSnapshot.find(u => u.id === notif.userId);
    
    if (targetUser && targetUser.notifications) {
      const prefs = targetUser.notifications;
      let shouldNotify = false;

      if (notif.type === 'REJECTION' && prefs.notifyOnRejection) shouldNotify = true;
      if (notif.type === 'APPROVAL' && prefs.notifyOnApproval) shouldNotify = true;
      if (notif.type === 'NEW_UPLOAD' && prefs.notifyOnNewUpload) shouldNotify = true;
      if (notif.type === 'SYSTEM') shouldNotify = true;

      if (!shouldNotify) return;

      if (prefs.emailEnabled) {
        console.log(`%c[EMAIL SIMULATOR] Sending email to: ${targetUser.email}\nSubject: ${notif.title}\nMessage: ${notif.message}`, "color: #2563eb; font-weight: bold;");
      }
    }

    if (USE_CLOUD_DB && db) {
      const docRef = doc(collection(db, COLL_NOTIFICATIONS));
      await setDoc(docRef, this.cleanData(notif));
    } else {
      const saved = localStorage.getItem(`notifs_${notif.userId}`);
      const current: Notification[] = saved ? JSON.parse(saved) : [];
      const updated = [{ ...notif, id: `notif-${Date.now()}` }, ...current].slice(0, 50);
      localStorage.setItem(`notifs_${notif.userId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  async markNotificationAsRead(id: string, userId: string) {
    if (USE_CLOUD_DB && db) {
      await updateDoc(doc(db, COLL_NOTIFICATIONS, id), { read: true });
    } else {
      const saved = localStorage.getItem(`notifs_${userId}`);
      if (saved) {
        const current: Notification[] = JSON.parse(saved);
        const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
        localStorage.setItem(`notifs_${userId}`, JSON.stringify(updated));
        window.dispatchEvent(new Event('local-data-changed'));
      }
    }
  }

  async getUsersOnce(): Promise<User[]> {
    if (USE_CLOUD_DB && db) {
      const snap = await getDocs(collection(db, COLL_USERS));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as User));
    } else {
      return this.getLocalUsers();
    }
  }

  async addActivity(activity: Activity) {
    const cleanAct = { ...activity, plantIds: this.cleanPlantIds(activity.plantIds) };
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = cleanAct; 
      await setDoc(doc(db, COLL_ACTIVITIES, cleanAct.id), this.cleanData(data));
    } else {
      const current = this.getLocalActivities();
      const updated = [...current, cleanAct];
      this.saveLocalActivities(updated);
    }
  }

  async updateActivity(activity: Activity) {
    const cleanAct = { ...activity, plantIds: this.cleanPlantIds(activity.plantIds) };
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = cleanAct;
      await updateDoc(doc(db, COLL_ACTIVITIES, id), this.cleanData(data));
    } else {
      const current = this.getLocalActivities();
      const updated = current.map(a => a.id === cleanAct.id ? cleanAct : a);
      this.saveLocalActivities(updated);
    }
  }

  async deleteActivity(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_ACTIVITIES, id));
    } else {
      const current = this.getLocalActivities();
      this.saveLocalActivities(current.filter(a => a.id !== id));
    }
  }

  async addUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      await setDoc(doc(db, COLL_USERS, user.id), this.cleanData(data));
    } else {
      const current = this.getLocalUsers();
      this.saveLocalUsers([...current, user]);
    }
  }

  async updateUser(user: User) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = user;
      await updateDoc(doc(db, COLL_USERS, id), this.cleanData(data));
    } else {
      const current = this.getLocalUsers();
      this.saveLocalUsers(current.map(u => u.id === user.id ? user : u));
    }
  }

  async deleteUser(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_USERS, id));
    } else {
      const current = this.getLocalUsers();
      this.saveLocalUsers(current.filter(u => u.id !== id));
    }
  }

  async addPlant(plant: Plant) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = plant;
      await setDoc(doc(db, COLL_PLANTS, id), this.cleanData(data));
    } else {
      const current = this.getLocalPlants();
      this.saveLocalPlants([...current, plant]);
    }
  }

  async updatePlant(plant: Plant) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = plant;
      await updateDoc(doc(db, COLL_PLANTS, id), this.cleanData(data));
    } else {
      const current = this.getLocalPlants();
      this.saveLocalPlants(current.map(p => p.id === plant.id ? plant : p));
    }
  }

  async deletePlant(id: string) {
    if (USE_CLOUD_DB && db) {
      await deleteDoc(doc(db, COLL_PLANTS, id));
    } else {
      const current = this.getLocalPlants();
      this.saveLocalPlants(current.filter(p => p.id !== id));
    }
  }

  async addStandard(std: StandardDefinition) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = std;
      await setDoc(doc(db, COLL_STANDARDS, id), this.cleanData(data));
    } else {
      const current = this.getLocalStandards();
      this.saveLocalStandards([...current, std]);
    }
  }

  async updateStandard(std: StandardDefinition) {
    if (USE_CLOUD_DB && db) {
      const { id, ...data } = std;
      await setDoc(doc(db, COLL_STANDARDS, id), this.cleanData(data));
    } else {
      const current = this.getLocalStandards();
      this.saveLocalStandards(current.map(s => s.id === std.id ? std : s));
    }
  }

  async updateSettings(settings: AppSettings) {
    if (USE_CLOUD_DB && db) {
      await setDoc(doc(db, COLL_SETTINGS, DOC_SETTINGS_GENERAL), this.cleanData(settings));
    } else {
      if (settings.companyLogo) localStorage.setItem('company_logo', settings.companyLogo);
      else localStorage.removeItem('company_logo');
      window.dispatchEvent(new Event('local-data-changed'));
    }
  }

  private cleanData(obj: any): any {
    if (Array.isArray(obj)) return obj.map(item => this.cleanData(item));
    else if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        newObj[key] = value === undefined ? null : this.cleanData(value);
      });
      return newObj;
    }
    return obj;
  }

  private getLocalActivities(): Activity[] {
    const s = localStorage.getItem('app_activities');
    return s ? JSON.parse(s).map((a: any) => ({ ...a, plantIds: this.cleanPlantIds(a.plantIds) })) : MOCK_ACTIVITIES_GERENCIA.map(a => ({ ...a, plantIds: ['MOSQUERA'] }));
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

  private getLocalStandards(): StandardDefinition[] {
    const s = localStorage.getItem('app_standards');
    return s ? JSON.parse(s) : [];
  }

  private saveLocalStandards(data: StandardDefinition[]) {
    localStorage.setItem('app_standards', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  private getLocalPlants(): Plant[] {
    const s = localStorage.getItem('app_plants');
    return s ? JSON.parse(s) : [];
  }

  private saveLocalPlants(data: Plant[]) {
    localStorage.setItem('app_plants', JSON.stringify(data));
    window.dispatchEvent(new Event('local-data-changed'));
  }

  public async seedInitialData() {
    if (!USE_CLOUD_DB || !db) throw new Error("No hay conexión a la Nube");
    
    console.log("Iniciando carga de datos masiva...");
    const batchPromises = [];

    for (const act of MOCK_ACTIVITIES_GERENCIA) {
       const { id, ...data } = act;
       const activityWithPlant = { ...data, plantIds: ['MOSQUERA'] };
       batchPromises.push(setDoc(doc(db, COLL_ACTIVITIES, id), this.cleanData(activityWithPlant)));
    }

    const seedUsers: User[] = [
      { id: 'u-admin', name: 'Administrador SIG', email: 'admin@centralmaderas.com', role: UserRole.ADMIN, assignedArea: 'HSEQ', password: '123', notifications: { notifyOnRejection: true, notifyOnApproval: true, notifyOnNewUpload: true, emailEnabled: true } }
    ];

    for (const user of seedUsers) {
       const { id, ...data } = user;
       batchPromises.push(setDoc(doc(db, COLL_USERS, id), this.cleanData(data)));
    }

    const defaultStandards: StandardDefinition[] = [
      { id: 'std-iso', type: StandardType.ISO9001, description: 'Sistemas de Gestión de Calidad.', objective: 'Mejora continua y satisfacción del cliente.', certifyingBody: 'ICONTEC', comments: [] },
      { id: 'std-sst', type: StandardType.SGSST, description: 'Sistemas de Seguridad y Salud en el Trabajo.', objective: 'Prevención de riesgos laborales.', certifyingBody: 'ARL', comments: [] },
      { id: 'std-fsc', type: StandardType.FSC, description: 'Manejo forestal responsable.', objective: 'Sustentabilidad ambiental.', certifyingBody: 'FSC Int.', comments: [] },
      { id: 'std-pesv', type: StandardType.PESV, description: 'Plan Estratégico de Seguridad Vial.', objective: 'Reducción de accidentalidad vial.', certifyingBody: 'SuperTransporte', comments: [] }
    ];

    for (const std of defaultStandards) {
      batchPromises.push(setDoc(doc(db, COLL_STANDARDS, std.id), this.cleanData(std)));
    }

    const initialPlants: Plant[] = [
      { id: 'MOSQUERA', name: 'Mosquera', location: 'Cundinamarca', isMain: true, description: 'Sede Matriz Principal' },
      { id: 'plt-cartagena', name: 'Cartagena', location: 'Bolívar', isMain: false, description: 'Planta de Producción Costa' },
      { id: 'plt-cali', name: 'Cali', location: 'Valle del Cauca', isMain: false, description: 'Planta de Producción Occidente' },
      { id: 'plt-yali', name: 'Yali', location: 'Antioquia', isMain: false, description: 'Planta de Extracción' },
      { id: 'plt-diluvio', name: 'Diluvio', location: 'Meta', isMain: false, description: 'Planta Operativa' },
      { id: 'plt-socialway', name: 'SocialWay', location: 'N/A', isMain: false, description: 'Unidad de Negocio Social' },
      { id: 'plt-ecocentral', name: 'EcoCentral', location: 'N/A', isMain: false, description: 'Unidad de Reciclaje' }
    ];

    for (const plt of initialPlants) {
      batchPromises.push(setDoc(doc(db, COLL_PLANTS, plt.id), this.cleanData(plt)));
    }

    await Promise.all(batchPromises);
    console.log("¡Carga completada!");
  }
}

export const dataService = new DataService();
