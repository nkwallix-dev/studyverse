/* Shared Studyverse boss/exam question policy.
 * Repetition/flashcards may keep ALL source-dependent prompts. Boss and
 * Prüfungssimulation select only independent subject questions.
 * Browser global + CommonJS export support regression tests.
 */
(function(root){
  'use strict';
  const SOURCE_DEPENDENT=/(?:folien?|unterrichtsfolien?|wiederholungsfolien?|präsentation|lernleitfaden|ki[- ]?lernhilfe|reaktionsblatt|skriptum|übungskontext|namentlich genannt|aus dem (?:skript|material)|euren?\s+(?:analogen\s+)?(?:multiple-choice-)?test)/i;
  function isExamQuestion(question){
    if(!question || typeof question !== 'object')return false;
    const prompt=typeof question.question==='string'?question.question:question.q;
    return typeof prompt==='string' && prompt.trim().length>12 &&
      !SOURCE_DEPENDENT.test(prompt);
  }
  root.STUDYVERSE_IS_EXAM_QUESTION=isExamQuestion;
  if(typeof module!=='undefined' && module.exports){
    module.exports={isExamQuestion};
  }
})(typeof window!=='undefined'?window:globalThis);
