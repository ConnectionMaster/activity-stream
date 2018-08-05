/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

this.NmfTextTagger = class NmfTextTagger {
  constructor(model, tokenizer) {
    this.model = model;
    this.tokenizer = tokenizer;
  }

  /**
   * Determines if the text belongs to class according to binary naive Bayes
   * classifier. Returns an object containing the class label ("label"), and
   * the log probability ("logProb") that the text belongs to that class. If
   * the positive class is more likely, then "label" is the positive class
   * label. If the negative class is matched, then "label" is set to null.
   */
  tag(text) {
    let fv = this.tokenizer.getTfIdfVector(text, this.model.vocab_idfs);
    let fve = Object.values(fv);

    // normalize by the sum of the vector
    let sum = 0.0;
    for (let i = 0; i < fve.length; i++) {
      // eslint-disable-next-line prefer-destructuring
      sum += fve[i][1];
    }
    for (let i = 0; i < fve.length; i++) {
      // eslint-disable-next-line prefer-destructuring
      fve[i][1] /= sum;
    }

    // dot the document with each topic vector so that we can transform it into
    // the latent space
    let toksInLatentSpace = [];
    for (let topicId = 0; topicId < this.model.topic_word.length; topicId++) {
      let fvDotTwv = 0;
      // dot fv with each topic word vector
      for (let j = 0; j < fve.length; j++) {
        // eslint-disable-next-line prefer-destructuring
        let [termId, tfidf] = fve[j];
        fvDotTwv += tfidf * this.model.topic_word[topicId][termId];
      }
      toksInLatentSpace.push(fvDotTwv);
    }

    // now project toksInLatentSpace back into class space
    let predictions = {};
    Object.keys(this.model.document_topic).forEach(topic => {
      let score = 0;
      for (let i = 0; i < toksInLatentSpace.length; i++) {
        score += toksInLatentSpace[i] * this.model.document_topic[topic][i];
      }
      predictions[topic] = score;
    });

    return predictions;
  }
};

const EXPORTED_SYMBOLS = ["NmfTextTagger"];