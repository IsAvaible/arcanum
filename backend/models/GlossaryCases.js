'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GlossaryCases extends Model {
    static associate(models) {
      // ggf. Beziehungen definieren
    }
  }

  GlossaryCases.init({}, {
    sequelize,
    modelName: 'GlossaryCases',
    tableName: 'GlossaryCases', // falls du abweichenden Tabellennamen hast
  });

  // Hook für Erstellen (Increment usageCount)
  GlossaryCases.afterCreate(async (glossaryCase, options) => {
    const { glossaryId } = glossaryCase;
    if (glossaryId) {
      const glossary = await sequelize.models.Glossary.findByPk(glossaryId);
      if (glossary) {
        glossary.usageCount += 1;
        await glossary.save();
      }
    }
  });

  // Hook für Entfernen (Decrement usageCount)
  GlossaryCases.afterDestroy(async (glossaryCase, options) => {
    const { glossaryId } = glossaryCase;
    if (glossaryId) {
      const glossary = await sequelize.models.Glossary.findByPk(glossaryId);
      if (glossary && glossary.usageCount > 0) {
        glossary.usageCount -= 1;
        await glossary.save();
      }
    }
  });

  return GlossaryCases;

};