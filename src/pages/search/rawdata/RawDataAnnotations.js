/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-use-before-define */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Select from 'react-select';
import api from '../../../api';
import Button from '../../../components/Bulma/Button/Button';
import HelpIcon from '../../../components/HelpIcon';
import './rawDataAnnotations.scss';
import TagInput from '../../../components/TagInput/TagInput';
import RawDataAnnotationResults from './RawDataAnnotationResults';
import SelectMultipleWithAutoComplete from '../../../components/SelectMultipleWithAtuComplete/SelectMultipleWithAutoComplete';

const EMPTY_SPECIES_VALUE = { label: 'Any species', value: '' };

const AFFYMETRIX = 'AFFYMETRIX';
const EST = 'EST';
const IN_SITU = 'IN_SITU';
const RNA_SEQ = 'RNA_SEQ';
const FULL_LENGTH = 'FULL_LENGTH';
const DATA_TYPES = [
  { id: FULL_LENGTH, label: 'scRNA-Seq full-length' },
  { id: RNA_SEQ, label: 'bulk RNA-Seq' },
  { id: AFFYMETRIX, label: 'Affymetrix data' },
  { id: IN_SITU, label: 'In situ hybridization' },
  { id: EST, label: 'EST' },
];

const RawDataAnnotations = () => {
  // lists
  const [speciesList, setSpeciesList] = useState([]);
  const [speciesSexe, setSpeciesSexe] = useState([]);

  // Form
  const [selectedSpecies, setSelectedSpecies] = useState(EMPTY_SPECIES_VALUE);
  const [selectedTissue, setSelectedTissue] = useState([]);
  const [selectedStrain, setSelectedStrain] = useState([]);
  const [selectedCellTypes, setSelectedCellTypes] = useState([]);
  const [selectedGene, setSelectedGene] = useState([]);
  const [selectedSexes, setSelectedSexes] = useState([]);
  const [hasCellTypeSubStructure, setHasCellTypeSubStructure] = useState(false);
  const [hasTissueSubStructure, setHasTissueSubStructure] = useState(false);
  const [hasDevStageSubStructure, setDevStageSubStructure] = useState(false);
  // const [selectExp, setSelectExp] = useState([]);

  // results
  const [show, setShow] = useState(true);
  const [searchResult, setSearchResult] = useState(null);
  const [dataType, setDataType] = useState(AFFYMETRIX);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (selectedSpecies.value !== '') {
      updateSexesForSpecies();
    }
    setSelectedCellTypes([]);
    setSelectedGene([]);
    setSelectedStrain([]);
    setSelectedTissue([]);
    setSelectedSexes([]);
  }, [selectedSpecies]);

  useEffect(() => {
    triggerSearch();
  }, [dataType]);

  const updateSexesForSpecies = () => {
    api.search.species
      .speciesDevelopmentSexe(selectedSpecies.value)
      .then((resp) => {
        if (resp.code === 200) {
          setSpeciesSexe(resp.data.requestDetails.requestedSpeciesSexes);
        } else {
          setSpeciesSexe([]);
        }
      });
  };
  const onSubmit = () => {
    triggerCounts();
    triggerSearch();
  };

  const getSearchParams = () => ({
    selectedSpecies: selectedSpecies.value,
    selectedGene: selectedGene.map((g) => g.value),
    selectedSexes: selectedSexes.length > 0 ? selectedSexes : ['all'],
    dataType,
    hasCellTypeSubStructure,
    hasDevStageSubStructure,
    hasTissueSubStructure,
  });

  const triggerSearch = async () =>
    api.search.rawData.search(getSearchParams()).then((resp) => {
      if (resp.code === 200) {
        setSearchResult(resp?.data);
      }
      return [];
    });

  const triggerCounts = async () =>
    api.search.rawData.search(getSearchParams(), true).then((resp) => {
      if (resp.code === 200) {
        setCounts(resp?.data?.resultCount);
      }
      return [];
    });

  const autoCompleteByType = (type, mappingFn) =>
    useCallback(
      async (query) => {
        if (query && selectedSpecies.value !== EMPTY_SPECIES_VALUE.value) {
          return api.search.genes
            .autoCompleteByType(type, query, selectedSpecies.value)
            .then((resp) => {
              if (resp.code === 200) {
                const results =
                  resp.data.result.searchMatches ||
                  resp.data.result.geneMatches;
                let list = [];
                list = results.map(mappingFn);
                return list;
              }
              return [];
            });
        }
        console.warn('Empty species or query !');
        return [];
      },
      [selectedSpecies]
    );

  const getOptionsFunctionGenes = autoCompleteByType('gene', (result) => ({
    label: `${result?.gene?.geneId}${
      result.gene?.name ? ` - ${result?.gene?.name}` : ''
    }`,
    value: result?.gene?.geneId,
    match: result?.match,
  }));

  const getCellTypeOptions = autoCompleteByType('cell_type', (result) => ({
    label: result?.object?.name,
    value: result?.object?.id,
    match: result?.match,
  }));

  const getStrainOptions = autoCompleteByType('strain', (result) => ({
    label: result?.object,
    value: result?.object,
    match: result?.match,
  }));

  const getTissueOptions = autoCompleteByType('anat_entity', (result) => ({
    label: result?.object?.name,
    value: result?.object?.id,
    match: result?.match,
  }));

  useEffect(() => {
    api.search.species.list().then((resp) => {
      if (resp.code === 200) {
        setSpeciesList(resp.data.species);
      } else {
        setSpeciesList([]);
      }
    });
  }, []);

  const metaKeywords = useMemo(() => {
    const list = speciesList.map((s) => ({
      label: `${s.genus.substr(0, 1)} ${s.speciesName} ${
        s.name ? `${s.name}` : ''
      }`,
      value: s.id,
    }));
    return [EMPTY_SPECIES_VALUE, ...list];
  }, [speciesList]);

  const toggleSex = (sexName) => {
    const i = selectedSexes.indexOf(sexName);
    if (i === -1) {
      setSelectedSexes([...selectedSexes, sexName]);
    } else {
      const nextSexes = [...selectedSexes];
      nextSexes.splice(i, 1);
      setSelectedSexes(nextSexes);
    }
  };

  return (
    <>
      <div className="container">
        {show && (
          <>
            <label className="title-raw">Search for Raw data annotations</label>
            <div className="row">
              <div className="selector col-sm-6">
                <div className="mb-2">
                  <label className="labelWithHelpIcon">
                    <span>Species</span>
                    <HelpIcon
                      className="helpIcon"
                      title="Species"
                      content={
                        <>
                          By default, all developmental and life stages are
                          considered for the enrichment analysis. It is possible
                          to provide a custom selection of developmental and
                          life stages, selecting one or several developmental
                          and life stages.
                        </>
                      }
                    />
                  </label>
                  <Select
                    options={metaKeywords}
                    className="form-control"
                    defaultValue={EMPTY_SPECIES_VALUE}
                    onChange={(e) => setSelectedSpecies(e)}
                  />
                </div>
                {selectedSpecies.value && (
                  <div>
                    <div className="my-2">
                      <label className="labelWithHelpIcon">
                        <span>Cell type</span>
                        <HelpIcon
                          className="helpIcon"
                          title="Cell type"
                          content={
                            <>
                              By default, all developmental and life stages are
                              considered for the enrichment analysis. It is
                              possible to provide a custom selection of
                              developmental and life stages, selecting one or
                              several developmental and life stages.
                            </>
                          }
                        />
                      </label>
                      <SelectMultipleWithAutoComplete
                        placeholder="Search Cell Type"
                        getOptionsFunction={getCellTypeOptions}
                        selectedOptions={selectedCellTypes}
                        setSelectedOptions={setSelectedCellTypes}
                      />
                      <div className="checkboxWrapper">
                        <input
                          id="hasCellTypeSubStructure"
                          type="checkbox"
                          checked={hasCellTypeSubStructure ? 'checked' : ''}
                          onChange={() =>
                            setHasCellTypeSubStructure(!hasCellTypeSubStructure)
                          }
                        />
                        <label htmlFor="hasCellTypeSubStructure">
                          Including substrcutures
                        </label>
                      </div>
                    </div>
                    <div className="my-2">
                      <label className="labelWithHelpIcon">
                        <span>Tissue</span>
                        <HelpIcon
                          className="helpIcon"
                          title="Tissue"
                          content={
                            <>
                              By default, all developmental and life stage are
                              considered for the enrichment analysis. It is
                              possible to provide a custom selection of
                              developmental and life stage, selecting one or
                              several developmental and life stage.
                            </>
                          }
                        />
                      </label>
                      <SelectMultipleWithAutoComplete
                        placeholder="Search Tissue"
                        getOptionsFunction={getTissueOptions}
                        selectedOptions={selectedTissue}
                        setSelectedOptions={setSelectedTissue}
                      />
                      <div className="checkboxWrapper">
                        <input
                          id="hasTissueSubStructure"
                          type="checkbox"
                          checked={hasTissueSubStructure ? 'checked' : ''}
                          onChange={() =>
                            setHasTissueSubStructure(!hasTissueSubStructure)
                          }
                        />
                        <label htmlFor="hasTissueSubStructure">
                          Including substrcutures
                        </label>
                      </div>
                    </div>
                    <div className="my-2">
                      <label className="labelWithHelpIcon">
                        <span>Development and life stage</span>
                        <HelpIcon
                          className="helpIcon"
                          title="Developmental and life stage"
                          content={
                            <>
                              By default, all developmental and life stages are
                              considered for the enrichment analysis. It is
                              possible to provide a custom selection of
                              developmental and life stages, selecting one or
                              several developmental and life stages.
                            </>
                          }
                        />
                      </label>
                      <Select />
                      <div className="checkboxWrapper">
                        <input
                          id="hasDevStageSubStructure"
                          type="checkbox"
                          checked={hasDevStageSubStructure ? 'checked' : ''}
                          onChange={() =>
                            setDevStageSubStructure(!hasDevStageSubStructure)
                          }
                        />
                        <label htmlFor="hasDevStageSubStructure">
                          Including substrcutures
                        </label>
                      </div>
                    </div>
                    <div className="my-2">
                      <label className="labelWithHelpIcon">
                        <span>Sex</span>
                        <HelpIcon
                          className="helpIcon"
                          title="Developmental and life stages"
                          content={
                            <>
                              By default, all developmental and life stages are
                              considered for the enrichment analysis. It is
                              possible to provide a custom selection of
                              developmental and life stages, selecting one or
                              several developmental and life stages.
                            </>
                          }
                        />
                      </label>
                      <div className="sex-container">
                        {speciesSexe.map((sex) => {
                          const isChecked =
                            selectedSexes.indexOf(sex.name) !== -1;
                          return (
                            <div
                              id={sex.name}
                              key={sex.name}
                              className="sex-input-name"
                            >
                              <input
                                onChange={() => toggleSex(sex.name)}
                                type="checkbox"
                                checked={isChecked ? 'checked' : ''}
                              />
                              <label
                                onClick={() => toggleSex(sex.name)}
                                htmlFor={sex.name}
                                className="sex-name"
                              >
                                {sex.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="col-md-6 my-2">
                <div className="input-form">
                  {selectedSpecies.value && (
                    <>
                      <div className="mb-2">
                        <label className="labelWithHelpIcon">
                          <span>Strain</span>
                          <HelpIcon
                            title="Strain"
                            className="helpIcon"
                            content={
                              <>
                                By default, all developmental and life stages
                                are considered for the enrichment analysis. It
                                is possible to provide a custom selection of
                                developmental and life stages, selecting one or
                                several developmental and life stages.
                              </>
                            }
                          />
                        </label>
                        <SelectMultipleWithAutoComplete
                          placeholder="Search Strain"
                          getOptionsFunction={getStrainOptions}
                          selectedOptions={selectedStrain}
                          setSelectedOptions={setSelectedStrain}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="labelWithHelpIcon">
                          <span>Gene</span>
                          <HelpIcon
                            className="helpIcon"
                            title="Gene"
                            content={
                              <>
                                By default, all developmental and life stages
                                are considered for the enrichment analysis. It
                                is possible to provide a custom selection of
                                developmental and life stages, selecting one or
                                several developmental and life stages.
                              </>
                            }
                          />
                        </label>
                        <SelectMultipleWithAutoComplete
                          placeholder="Search Gene"
                          getOptionsFunction={getOptionsFunctionGenes}
                          selectedOptions={selectedGene}
                          setSelectedOptions={setSelectedGene}
                        />
                      </div>
                    </>
                  )}
                  <div className="mb-2">
                    <label className="labelWithHelpIcon">
                      <span>Experiment or assay ID</span>
                      <HelpIcon
                        title="Experiment or assay ID"
                        className="helpIcon"
                        content={
                          <>
                            By default, all developmental and life stages are
                            considered for the enrichment analysis. It is
                            possible to provide a custom selection of
                            developmental and life stages, selecting one or
                            several developmental and life stages.
                          </>
                        }
                      />
                    </label>
                    <TagInput />
                  </div>
                  <div className="submit-reinit">
                    <Button type="submit" onClick={onSubmit}>
                      Submit
                    </Button>
                    <Button className="reinit">Reinitialize</Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="control is-flex is-align-items-center">
          <button
            className="button mr-2 mb-5"
            type="button"
            onClick={() => setShow(!show)}
          >
            {show ? 'Hide Filter' : 'Show Filter'}
          </button>
        </div>
        <label className="title-raw">Raw data annotations results</label>
        <div className="is-flex columns ongletWrapper is-centered">
          {DATA_TYPES.map((type) => {
            const isActive = type.id === dataType;
            return (
              <div
                key={type.id}
                onClick={() => setDataType(type.id)}
                className={`onglet column is-centered ${
                  isActive && 'ongletActive'
                }`}
              >
                <span>{type.label}</span>
                <span>
                  (
                  {searchResult?.resultCount?.[type.id]?.assayCount ||
                    'No data'}
                  )
                </span>
              </div>
            );
          })}
        </div>
        {!!searchResult && (
          <RawDataAnnotationResults
            results={searchResult?.results?.[dataType]}
            filters={searchResult?.filters?.[dataType]}
            resultCount={counts[dataType]}
            dataType={dataType}
          />
        )}
      </div>
    </>
  );
};

export default RawDataAnnotations;
