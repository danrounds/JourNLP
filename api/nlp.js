const retext = require('retext');
const nlcstToString = require('nlcst-to-string');
const keywords = require('retext-keywords');

// const text =             /* First three paragraphs on Term Extraction from Wikipedia:
//                           * http://en.wikipedia.org/wiki/Terminology_extraction */
//           'Terminology mining, term extraction, term recognition, or ' +
//           'glossary extraction, is a subtask of information extraction. ' +
//           'The goal of terminology extraction is to automatically extract ' +
//           'relevant terms from a given corpus.' +
//           '\n\n' +
//           'In the semantic web era, a growing number of communities and ' +
//           'networked enterprises started to access and interoperate through ' +
//           'the internet. Modeling these communities and their information ' +
//           'needs is important for several web applications, like ' +
//           'topic-driven web crawlers, web services, recommender systems, ' +
//           'etc. The development of terminology extraction is essential to ' +
//           'the language industry.' +
//           '\n\n' +
//           'One of the first steps to model the knowledge domain of a ' +
//           'virtual community is to collect a vocabulary of domain-relevant ' +
//           'terms, constituting the linguistic surface manifestation of ' +
//           'domain concepts. Several methods to automatically extract ' +
//           'technical terms from domain-specific document warehouses have ' +
//           'been described in the literature.' +
//           '\n\n' +
//           'Typically, approaches to automatic term extraction make use of ' +
//           'linguistic processors (part of speech tagging, phrase chunking) ' +
//           'to extract terminological candidates, i.e. syntactically ' +
//           'plausible terminological noun phrases, NPs (e.g. compounds ' +
//           '"credit card", adjective-NPs "local tourist information office", ' +
//           'and prepositional-NPs "board of directors" - in English, the ' +
//           'first two constructs are the most frequent). Terminological ' +
//           'entries are then filtered from the candidate list using ' +
//           'statistical and machine learning methods. Once filtered, ' +
//           'because of their low ambiguity and high specificity, these terms ' +
//           'are particularly useful for conceptualizing a knowledge domain ' +
//           'or for supporting the creation of a domain ontology. Furthermore, ' +
//           'terminology extraction is a very useful starting point for ' +
//           'semantic similarity, knowledge management, human translation ' +
//           'and machine translation, etc.';

// function test() {
//     categorize(text)
//         .then(out => console.log(out));
// }

function categorize(text) {
    const nKeywords = Math.round( Math.log1p(text.length / 5.3 || 3 ));
    return Promise.resolve(retext().use(keywords, {maximum: nKeywords}).process(text))
        .then(file => {
            const [keywords, keyphrases] = [[],[]]; 
            file.data.keywords.forEach(keyword => {
                keywords.push(nlcstToString(keyword.matches[0].node));
            });
            file.data.keyphrases.forEach(phrase => {
                keyphrases.push(phrase.matches[0].nodes.map(nlcstToString).join(''));
            });

            if (!keyphrases.length)
                return keywords;
            return keyphrases;
        });
}

module.exports = {categorize};
