import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {onDocumentCreated, onDocumentWritten} from 'firebase-functions/v2/firestore';
import {provisionalXp,levelFor} from './rank';

initializeApp();
const db=getFirestore();
const region='europe-west1';

/** Read the latest save in a transaction, so delayed events cannot restore an older level. */
async function projectLevel(uid:string):Promise<void>{
  const user=db.doc(`users/${uid}`),card=db.doc(`publicProfiles/${uid}`);
  await db.runTransaction(async tx=>{
    const [userSnap,cardSnap]=await tx.getAll(user,card);
    if(!userSnap.exists||!cardSnap.exists)return;
    const xp=provisionalXp(userSnap.data());
    if(xp===null)return;
    const level=levelFor(xp);
    if(cardSnap.get('level')===level)return;
    tx.update(card,{level});
  });
}

/** Progress updates become visible without waiting for an unreliable cron run. */
export const projectLevelOnSave=onDocumentWritten(
  {document:'users/{uid}',region},async event=>{
    if(provisionalXp(event.data?.before.data())===provisionalXp(event.data?.after.data()))return;
    await projectLevel(event.params.uid);
  });

/** Registration writes /users before creating its public card. */
export const projectLevelOnCardCreate=onDocumentCreated(
  {document:'publicProfiles/{uid}',region},async event=>{
    await projectLevel(event.params.uid);
  });
