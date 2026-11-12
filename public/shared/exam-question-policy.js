/* Shared eligibility filter for Studyverse exam simulations.
 * The training quiz keeps its complete question bank. A boss must test
 * subject knowledge, not memorized slides, specific notebooks, people,
 * the source dataset, launch years, or prior demo-data outputs.
 */
(function(root){
  'use strict';
  const SOURCE_REFERENCE=/(?:folien?|unterrichtsfolien?|wiederholungsfolien?|präsentation|lernleitfaden|ki[- ]?lernhilfe|reaktionsblatt|skriptum|übungskontext|namentlich genannt|original|notebook|in eure[mn]? (?:daten|datensatz|test)|euren?\s+(?:analogen\s+)?(?:multiple-choice-)?test)/i;
  const ORIGINAL_DATASET=/(?:\b(?:19|20)\d{2}\b|festival(?:-modell|-gerade)?|\bsal(?:\.|\[)|salaries(?:\.csv)?|basepay|overtimepay|jobtitle|transit operator|\bchief\b)/i;
  const DSAI_TOPICS=new Set(['intro','bigdata','science','ai','history','pipeline','crisp','kdd',
    'regression','scales','numpy1','numpy2','numpy3','pandas1','pandas2','environment']);
  function isExamQuestion(q){
    if(!q || typeof q!=='object')return false;
    const prompt=typeof q.question==='string'?q.question:q.q;
    if(typeof prompt!=='string'||prompt.trim().length<12||SOURCE_REFERENCE.test(prompt))return false;
    const dsai=q.subject==='dsai'||DSAI_TOPICS.has(q.topic);
    if(dsai){
      // Include code and choices: a neutral-looking prompt could still demand
      // a year or the name/value of a specific Salaries/Festival dataset.
      const context=[prompt,q.code||'',...(Array.isArray(q.choices)?q.choices:[])].join(' ');
      if(ORIGINAL_DATASET.test(context))return false;
      if(/^(?:wann fand|welches jahr|welche person|wer wird|wie viele.*(?:jobs|treffer))/i.test(prompt))return false;
      // The standalone NumPy trainer includes an input array, but several
      // Daily Arena copies omit it. Never ask for a numeric output of an
      // undefined array in a high-stakes boss simulation.
      if(q.subject==='dsai' && /\\ba(?:\\[|\\.(?:sum|min|shape|size))/.test(q.code||'') &&
         !/\\ba\\s*=\\s*np\\.array\\(/.test(q.code||'') &&
         /^(?:was (?:liefert|ist|gibt)|welche ausgabe)/i.test(prompt))return false;
    }
    return true;
  }
  root.STUDYVERSE_IS_EXAM_QUESTION=isExamQuestion;
  if(typeof module!=='undefined' && module.exports)module.exports={isExamQuestion};
})(typeof window!=='undefined'?window:globalThis);
