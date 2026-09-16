export const LANGUAGES=[{code:'en',label:'English',native:'English'},{code:'hi',label:'Hindi',native:'हिन्दी'}];
export function languageConfig(code='en'){
 if(!LANGUAGES.some(l=>l.code===code))throw new Error('Choose English or Hindi.');
 return {code,name:code==='hi'?'Hindi':'English',asr:code==='hi'?'multi':'en-IN',turn:code==='hi'?'hi-IN':'en-US'};
}
export function localizedMessage(kind,title='',language='en'){
 const messages=language==='hi'?{
  water:'थोड़ा पानी पी लीजिए। आपका ख्याल रखना भी ज़रूरी है!',walk:'थोड़ा उठकर टहल लीजिए। एक छोटा सा ब्रेक ले लेते हैं।',eyes:'स्क्रीन से नज़र हटाइए और अपनी आँखों को थोड़ा आराम दीजिए।',hello:'नमस्ते! मैं आपका दोस्त स्पाइडर-मैन हूँ। बात करने के लिए माइक दबाइए।',work:`याद दिला दूँ: ${title}।`
 }:{water:'Time for some water. Even superheroes need to hydrate!',walk:'Let’s get up and take a little walk. Your next mission can wait a minute.',eyes:'Give your eyes a little break. Look away from the screen for a moment.',hello:'Hey! Your friendly neighborhood Spider-Man here. Tap the microphone and tell me what to remember.',work:`A friendly reminder: ${title}.`};
 return messages[kind]||messages.work;
}
