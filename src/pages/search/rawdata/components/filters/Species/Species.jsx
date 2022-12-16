import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../../../../../../api';

export const EMPTY_SPECIES_VALUE = { label: 'Any species', value: '' };

const Species = ({ selectedSpecies, onChangeSpecies, getSpeciesLabel }) => {
  const [speciesList, setSpeciesList] = useState([]);

  const speciesOptions = useMemo(() => {
    const list = speciesList.map((s) => ({
      label: getSpeciesLabel(s),
      value: s.id,
    }));

    return [EMPTY_SPECIES_VALUE, ...list];
  }, [speciesList]);

  useEffect(() => {
    api.search.species.list().then((resp) => {
      if (resp.code === 200) {
        setSpeciesList(resp.data.species);
      } else {
        setSpeciesList([]);
      }
    });
  }, []);

  return (
    <>
      <label className="labelWithHelpIcon">
        <span>Species</span>
      </label>
      <Select
        options={speciesOptions}
        className="form-control"
        classNamePrefix="react-select"
        value={selectedSpecies}
        onChange={onChangeSpecies}
      />
    </>
  );
};

export default Species;
