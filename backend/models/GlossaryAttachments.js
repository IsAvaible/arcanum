'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GlossaryAttachments extends Model {
    static associate(models) {
      // ggf. Beziehungen definieren
    }
  }

  GlossaryAttachments.init({}, {
    sequelize,
    modelName: 'GlossaryAttachments',
    tableName: 'GlossaryAttachments', // falls du abweichenden Tabellennamen hast
  });

  // Hook für Erstellen (Increment usageCount)
  GlossaryAttachments.afterCreate(async (glossaryCase, options) => {
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
  GlossaryAttachments.afterDestroy(async (glossaryCase, options) => {
    const { glossaryId } = glossaryCase;
    if (glossaryId) {
      const glossary = await sequelize.models.Glossary.findByPk(glossaryId);
      if (glossary && glossary.usageCount > 0) {
        glossary.usageCount -= 1;
        await glossary.save();
      }
    }
  });

  return GlossaryAttachments;
};