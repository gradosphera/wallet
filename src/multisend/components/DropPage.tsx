import type { Wallet } from '@tonconnect/sdk';
import React, { memo, useEffect, useRef, useState } from '../../lib/teact/teact';

import type { TransferRow, ValidationError } from '../types';

import buildClassName from '../../util/buildClassName';
import { downloadTemplate, MIXED_TRANSFERS_TEMPLATE } from '../utils/csvTemplates';
import { prettifyAddress } from '../utils/tonConnect';
import { validateAndProcessTransfer } from '../utils/transferValidation';

import useLastCallback from '../../hooks/useLastCallback';
import useShowTransition from '../../hooks/useShowTransition';

import Button from '../../components/ui/Button';

import styles from './DropPage.module.scss';

import blagoLogo from '../../assets/coins/blago-logo.svg';

interface OwnProps {
  wallet?: Wallet;
  onConnectClick: NoneToVoidFunction;
  onDisconnectClick: NoneToVoidFunction;
  onAddTransferClick: NoneToVoidFunction;
  onSetCsvData: (data: TransferRow[]) => void;
  onNavigateToTransferList: () => void;
}

function DropPage({
  wallet,
  onConnectClick,
  onDisconnectClick,
  onAddTransferClick,
  onSetCsvData,
  onNavigateToTransferList,
}: OwnProps) {
  const [isDropActive, setIsDropActive] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | undefined>();
  const [isValidatingCsv, setIsValidatingCsv] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>();

  const maxMessages = wallet?.device.features
    .find((f) => typeof f === 'object' && 'maxMessages' in f)?.maxMessages || 255;

  const { shouldRender: shouldRenderError, ref: errorRef } = useShowTransition({
    isOpen: Boolean(validationError),
    withShouldRender: true,
  });

  const processCsvFile = useLastCallback((file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const rows = content.split(/\r?\n/).filter((line) => line.trim() !== '');

      if (rows.length > maxMessages) {
        setValidationError({
          line: maxMessages + 1,
          column: 0,
          reason: `Файл CSV превышает максимум из ${maxMessages} переводов`,
        });
        return;
      }

      setIsValidatingCsv(true);
      setValidationError(undefined);
      onSetCsvData([]);

      const parsedData: TransferRow[] = [];
      let error: ValidationError | undefined;

      for (let i = 0; i < rows.length; i++) {
        const line = rows[i].trim();
        const columns = line.split(',').map((col) => col.trim());

        if (columns.length < 3) {
          error = {
            line: i + 1,
            column: columns.length + 1,
            reason: 'Строка должна содержать минимум 3 столбца: получатель, сумма и тип токена',
          };
          break;
        }

        const transfer = {
          receiver: columns[0],
          amount: columns[1],
          tokenIdentifier: columns[2],
          comment: columns[3] || '',
        };

        try {
          const validationResult = await validateAndProcessTransfer(transfer);

          if (!validationResult.isValid) {
            error = {
              line: i + 1,
              column: 1,
              reason: validationResult.error || 'Ошибка проверки',
            };
            break;
          }

          if (validationResult.processedTransfer) {
            parsedData.push(validationResult.processedTransfer);
          }
        } catch (err) {
          error = {
            line: i + 1,
            column: 1,
            reason: err instanceof Error ? err.message : 'Ошибка обработки',
          };
          break;
        }
      }

      setIsValidatingCsv(false);

      if (error) {
        setValidationError(error);
        onSetCsvData([]);
      } else {
        setValidationError(undefined);
        onSetCsvData(parsedData);
        if (wallet) {
          onNavigateToTransferList();
        } else {
          setPendingFile(file);
          onConnectClick();
        }
      }
    };

    reader.readAsText(file);
  });

  const handleDrop = useLastCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processCsvFile(file);
    }
  });

  const handleDragOver = useLastCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropActive(true);
  });

  const handleDragLeave = useLastCallback(() => {
    setIsDropActive(false);
  });

  const handleFileChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCsvFile(e.target.files[0]);
    }
  });

  const handleButtonClick = useLastCallback(() => {
    if (!wallet) {
      onConnectClick();
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  });

  const handleAddTransfer = useLastCallback(() => {
    if (!wallet) {
      onConnectClick();
      return;
    }
    onAddTransferClick();
  });

  const handleDownloadTemplate = useLastCallback(() => {
    downloadTemplate(MIXED_TRANSFERS_TEMPLATE, 'multisend-template.csv');
  });

  useEffect(() => {
    if (wallet && pendingFile) {
      const fileToProcess = pendingFile;
      setPendingFile(undefined);
      processCsvFile(fileToProcess);
    }
  }, [wallet, pendingFile, processCsvFile]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.root}>
          <div
            className={buildClassName(styles.importPanel, isDropActive && styles.dropActive)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <span className={styles.logo} aria-hidden style={`--logo-url: url(${blagoLogo})`} />
            <p className={styles.title}>
              Отправляйте Gram и жетоны сразу нескольким получателям одной транзакцией
            </p>

            <div className={styles.importButtons}>
              <Button
                isSecondary
                onClick={handleAddTransfer}
                className={buildClassName(styles.importButton, styles.addButton)}
              >
                Добавить первый перевод
              </Button>
              <Button
                onClick={handleButtonClick}
                isLoading={isValidatingCsv}
                className={styles.importButton}
              >
                Загрузить CSV
              </Button>
              <Button
                onClick={handleDownloadTemplate}
                isSmall
                className={styles.importButton}
              >
                Скачать образец CSV
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />
          </div>

          {shouldRenderError && (
            <div ref={errorRef} className={styles.errorMessage}>
              Ошибка в строке {validationError?.line},
              столбце {validationError?.column}. {validationError?.reason}
            </div>
          )}
        </div>
      </div>
      <div className={styles.description}>
        {wallet ? (
          <>
            {!!maxMessages && (
              <p>
                Подключённый кошелёк поддерживает до <b>{maxMessages}</b> переводов.
                {!!maxMessages && maxMessages <= 4 && (
                  <>{' '}Используйте кошелёк <b>W5</b>, чтобы отправлять до <b>255</b> переводов.</>
                )}
              </p>
            )}
          </>
        ) : (
          <p>
            Подключите <b>Кошелёк ДАО Градосфера</b>,<br />чтобы получить доступ к мультиотправке.
          </p>
        )}
      </div>

      <section className={styles.blago}>
        <h2 className={styles.blagoTitle}>Жетон Благо (BLG)</h2>
        <p className={styles.blagoText}>
          Благо — utility-токен экосистемы ДАО Градосфера. Стандартный jetton в сети TON (TEP-74)
          с расширенным управлением со стороны ДАО через мультиподпись.
        </p>
        <dl className={styles.blagoFacts}>
          <div className={styles.blagoFact}>
            <dt>Символ</dt>
            <dd>BLG</dd>
          </div>
          <div className={styles.blagoFact}>
            <dt>Точность</dt>
            <dd>0 десятичных знаков</dd>
          </div>
          <div className={styles.blagoFact}>
            <dt>Стандарт</dt>
            <dd>Jetton master, TEP-74</dd>
          </div>
          <div className={styles.blagoFact}>
            <dt>Верификация</dt>
            <dd>10.09.2024, подтверждена</dd>
          </div>
          <div className={styles.blagoFact}>
            <dt>Лицензия</dt>
            <dd>CC0-1.0</dd>
          </div>
        </dl>

        <h3 className={styles.blagoSubtitle}>Управление ДАО</h3>
        <p className={styles.blagoText}>
          ДАО может перевести жетон из кошелька пользователя, сжигать его, блокировать и
          разблокировать аккаунты, а также обновлять код контракта и метаданные. Даже заблокированный
          аккаунт остаётся под полным контролем ДАО.
        </p>

        <h3 className={styles.blagoSubtitle}>Модель распределения</h3>
        <p className={styles.blagoText}>
          <b>Благодарность</b> — личный вклад, оценивается как произведение вклада на время и качество работы
          (время × качество). <b>Благо</b> — агрегированный общественный вклад с учётом числа пользователей
          (U) и коэффициента БлагоРодства (r).
        </p>

        <div className={styles.blagoLinks}>
          <a
            className={styles.blagoLink}
            href="https://github.com/gradosphera/blago-jetton"
            target="_blank"
            rel="noreferrer noopener"
          >
            Репозиторий жетона
          </a>
          <a
            className={styles.blagoLink}
            href="https://tonviewer.com/EQBlaryI1HCY6hIlW9giBoqKGtuMHfxlULZOhD6UyzpqLcll"
            target="_blank"
            rel="noreferrer noopener"
          >
            Мастер-контракт на Tonviewer
          </a>
        </div>
      </section>
      {wallet ? (
        <div className={styles.walletInfo}>
          <div className={styles.walletAddress}>
            {wallet?.account ? prettifyAddress(wallet.account.address) : undefined}
          </div>
          <div className={styles.walletDescription}>
            Подключённый кошелёк
            {' · '}
            <span className={styles.disconnectLink} onClick={onDisconnectClick}>
              Отключить
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.footer}>
          <Button
            isSimple
            className={styles.connectButton}
            onClick={onConnectClick}
          >
            Подключить Кошелёк ДАО Градосфера
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(DropPage);
