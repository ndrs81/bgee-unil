import React from 'react';
import { useHistory } from 'react-router-dom';
import api from '../api';
import useForm from './useForm';
import array from '../helpers/array';
import useToggle from './useToggle';
import PATHS from '../routes/paths';
import { NotificationContext } from '../contexts/NotificationsContext';
import { addTopAnatHistory } from '../components/TopAnat/TopAnatHistoryModal';

export const TOP_ANAT_FORM_CONFIG = {
  initialValue: {
    genes: '',
    genesBg: '',
    email: '',
    jobDescription: '',
    stages: 'all',
    dataQuality: 'all',
    decorrelationType: 'classic',
    nodeSize: '20',
    nbNode: '20',
    fdrThreshold: '0.2',
    pValueThreshold: '1',
    rnaSeq: true,
    affymetrix: true,
    inSitu: true,
    est: true,
  },
  validations: {
    genes: {
      required: {
        value: true,
        message: 'The job needs to run with some genes.',
      },
    },
    email: {
      nodeSize: {
        required: {
          value: true,
          message: 'Please choose a node size (ex: 20)',
        },
      },
      nbNode: {
        required: {
          value: true,
          message: 'Please choose a number of nodes (ex: 20)',
        },
      },
      fdrThreshold: {
        required: {
          value: true,
          message: 'Please choose a FDR threshold (ex: 0.2)',
        },
      },
      pValueThreshold: {
        required: {
          value: true,
          message: 'Please choose a p-value threshold (ex: 1)',
        },
      },
    },
  },
};

let timeoutFg;
let timeoutBg;

const useTopAnat = () => {
  const { addNotification } = React.useContext(NotificationContext);
  const [searchInfo, setSearchInfo] = React.useState();
  const [expandOpts, setExpandOpts] = React.useState(false);
  const [fgData, setFgData] = React.useState();
  const [bgData, setBgData] = React.useState();
  const [speciesBg, { toTrue: setSpeciesBgTrue, toFalse: setSpeciesBgFalse }] =
    useToggle(false);

  const history = useHistory();
  const onSubmit = React.useCallback((data) => {
    const formattedData = data; // to format for api
    setSearchInfo({ waitingResponse: true });
    api.topAnat.runJob(formattedData).then((res) => {
      history.push(
        PATHS.ANALYSIS[
          res.data.jobResponse.jobStatus === 'RUNNING'
            ? 'TOP_ANAT_RESULT_JOB_ID'
            : 'TOP_ANAT_RESULT'
        ]
          .replace(':id', res.data.jobResponse.data)
          .replace(':jobId', res.data.jobResponse.jobId)
      );
    });
  }, []);

  const {
    data,
    setData,
    handleChange,
    handleSubmit,
    errors,
    edition: { isEditable, setIsEditable },
    reset,
  } = useForm({
    ...TOP_ANAT_FORM_CONFIG,
    onSubmit,
  });
  const foregroundHandler = React.useCallback(
    (e) => {
      handleChange('genes')(e);
      if (!isEditable) return;
      if (timeoutFg) clearTimeout(timeoutFg);
      if (e.target.value !== '') {
        timeoutFg = setTimeout(() => {
          api.topAnat
            .autoCompleteForegroundGenes(e.target.value, 'fg')
            .then((r) => {
              setSpeciesBgFalse();
              handleChange('genesBg', () => '')();
              handleChange('rnaSeq', () => true)();
              handleChange('affymetrix', () => true)();
              handleChange('inSitu', () => true)();
              handleChange('est', () => true)();
              setFgData({ fg_list: r.data.fg_list, message: r.message });
            });
        }, 1000);
      } else setFgData(undefined);
    },
    [data, isEditable]
  );
  const backgroundHandler = React.useCallback(
    (e) => {
      handleChange('genesBg')(e);
      if (!isEditable) return;
      const bg = e.target.value.split('\n');
      const fg = data.genes.split('\n');

      if (timeoutBg) clearTimeout(timeoutBg);
      if (!array.equals(fg, bg)) {
        timeoutBg = setTimeout(
          () =>
            addNotification({
              id: Math.random().toString(10),
              children: (
                <p>Gene list contains genes not found in background genes.</p>
              ),
              className: `is-danger`,
            }),
          2000
        );
      }
      if (e.target.value !== '' && array.equals(fg, bg)) {
        timeoutBg = setTimeout(() => {
          api.topAnat
            .autoCompleteForegroundGenes(e.target.value, 'bg')
            .then((r) => {
              if (
                r.data.fg_list.selectedSpecies !==
                fgData.fg_list.selectedSpecies
              ) {
                addNotification({
                  id: Math.random().toString(10),
                  children: (
                    <p>
                      Foreground and background species differ. You can either
                      change your background or the default one will be used.
                    </p>
                  ),
                  className: `is-danger`,
                });
              }
              setBgData({ bg_list: r.data.bg_list, message: r.message });
            });
        }, 1000);
      }
    },
    [data, fgData, isEditable]
  );
  const checkBoxHandler = React.useCallback(
    (key) => (e) => handleChange(key, (event) => event.target.checked)(e),
    []
  );
  const onSelectCustomStage = React.useCallback(
    (id) => (e) => {
      if (!fgData) {
        addNotification({
          id: Math.random().toString(10),
          children: <p>No species detected from gene list</p>,
          className: `is-warning`,
        });
        return;
      }
      if (id) {
        const tmp = [...data.stages];
        if (e.target.checked) {
          tmp.push(id);
        } else {
          // remove
          tmp.splice(
            tmp.findIndex((a) => a === id),
            1
          );
        }
        handleChange('stages', () => tmp)();
      } else {
        handleChange('stages', () =>
          e === 'all' ? 'all' : fgData.fg_list.stages.map((s) => s.id)
        )();
      }
    },
    [data, fgData]
  );

  return {
    form: {
      data,
      setData,
      handleChange,
      handleSubmit,
      errors,
      edition: { isEditable, setIsEditable },
      foregroundHandler,
      backgroundHandler,
      checkBoxHandler,
      onSelectCustomStage,
      resetForm: reset,
    },
    searchInfo: {
      value: searchInfo,
      setSearchInfo,
    },
    expandOpts: {
      value: expandOpts,
      setExpandOpts,
    },
    fgData: {
      value: fgData,
      setFgData,
    },
    bgData: {
      value: bgData,
      setBgData,
    },
    species: { speciesBg, setSpeciesBgTrue, setSpeciesBgFalse },
  };
};

export default useTopAnat;