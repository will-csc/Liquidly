import pandas as pd
from openpyxl import Workbook, load_workbook
import datetime
import os
import json
import sys
import traceback

# ----------- Tratamento de Erros Global -----------
def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    error_msg = str(exc_value)
    # Mapear erros comuns para mensagens amigáveis
    if "Permission denied" in error_msg:
        error_msg = "Permissão negada. Verifique se o arquivo Excel (BNDES Report) está aberto e feche-o antes de continuar."
    elif "No such file or directory" in error_msg:
        error_msg = f"Arquivo não encontrado. Verifique se os arquivos de origem (NFs, BOM, POs) estão na pasta 'sources'."
    elif "ValueError" in str(exc_type):
        error_msg = f"Erro de valor: {error_msg}"
    
    print("Uncaught exception:", file=sys.stderr)
    traceback.print_exception(exc_type, exc_value, exc_traceback)
    
    # Atualiza o arquivo de progresso com o erro
    try:
        current_directory = os.getcwd()
        progress_file = os.path.join(current_directory, 'sources', 'progress.json')
        temp_file = progress_file + '.tmp'
        
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump({
                "status": "error",
                "current": 0,
                "total": 0,
                "message": error_msg
            }, f)
        
        if os.path.exists(progress_file):
            os.remove(progress_file)
        os.rename(temp_file, progress_file)
    except Exception as e:
        print(f"Falha ao reportar erro para o arquivo de progresso: {e}", file=sys.stderr)

sys.excepthook = handle_exception

# ----------- Funções -----------
def convert_um(material, qtd_nf, um_nf, conv_df):
    try:
        conv_rows = conv_df.loc[(conv_df['Material'] == material) & (conv_df['UM_NF'] == um_nf)]
        if conv_rows.empty:
            raise ValueError(f"Material {material} não encontrado na tabela de conversão.")
        
        conv_row = conv_rows.iloc[0]
        #print(f"{conv_row['QTD_Material']} / {conv_row['QTD_NF']} = {conv_row['QTD_Material'] / conv_row['QTD_NF']}")
        # A conversão deve respeitar a regra de três: 
        # Fator = Qtd_Destino (BOM) / Qtd_Origem (NF)
        fator_conversao = conv_row['QTD_Material'] / conv_row['QTD_NF']

        qtd_convertida = qtd_nf * fator_conversao
        return qtd_convertida, conv_row['UM_Material'], fator_conversao
    except Exception as e:
        print(f"Erro ao processar material {material} com UnidadeDeMedida {um_nf} na nota fiscal. Detalhes: {str(e)}")

def smart_round(valor):
    try:
        if abs(valor) < 1:
            return round(valor, 7)
        else:
            return round(valor, 4)
    except:
        return valor

def mes_atual():
    # Obter a data atual
    data_atual = datetime.datetime.now()

    # Um dicionário para mapear os meses para a abreviação desejada
    meses = {
        1: 'jan',
        2: 'fev',
        3: 'mar',
        4: 'abr',
        5: 'mai',
        6: 'jun',
        7: 'jul',
        8: 'ago',
        9: 'set',
        10: 'out',
        11: 'nov',
        12: 'dez'
    }

    # Formatar a string com o mês abreviado e o ano apenas com os dois últimos dígitos
    mes_abreviado = meses[data_atual.month]
    ano_abreviado = data_atual.strftime('%y')

    return f"{mes_abreviado}.{ano_abreviado}"

def add_new_row(ws,row_po,row_bom,qtd_pendente_bomXpo,qtd_consumido_po):
    linha = [
                row_po['PO'], 
                row_bom['CodUnico'],
                row_bom['Efetividade'],
                row_bom["Componente"],
                row_bom["Nivel_Explosao"],
                row_bom["Desc_Componente"],
                row_bom["Unidade_De_Medida"],
                "Sem data / PO",
                row_po["PO"],
                "PO", 
                row_bom["QtdComponente"],
                0,
                qtd_consumido_po,
                0,
                row_po["Quantidade"],
                0,
                0,
                qtd_pendente_bomXpo,
                True,
                True,
                row_po["Processado"],#19
                row_po["NCM"],
                "Sem Chave / PO",
                "",
                "",
                row_po["Valor Contabil"],
                row_po["Aliq. Total"],
                row_po["Valor Contabil Total PER\nSEM IMPOSTO"],
                row_po["UnidadeDeMedida"],
                row_po["Preço Liquido Unitário\nCOM IMPOSTO"],
                row_po["Preço Liquido Total Per\nSEM IMPOSTO"],
                row_po["Pais"],
                "",
                "",
                row_po["Aliq. ICMS"],
                row_po["Aliq. IPI"],
                row_po["Aliq. PIS"],
                row_po["Aliq. COFINS"],
                "",
                "",
            ]
    ws.append(linha)

# ----------- Carga para Relatorio BNDES ----------------
def main(stop_event=None):
    # Obtém o diretório atual de trabalho (onde o executável/script está rodando)
    current_directory = os.getcwd()
    progress_file = os.path.join(current_directory, 'sources', 'progress.json')

    def update_progress_safe(current, total, status="running", message=None):
        temp_file = progress_file + '.tmp'
        try:
            data = {
                "status": status,
                "current": current,
                "total": total,
            }
            if message:
                data["message"] = message
                
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f)
            
            # Retry logic for Windows file locking
            max_retries = 10
            for i in range(max_retries):
                try:
                    if os.path.exists(progress_file):
                        os.remove(progress_file)
                    os.rename(temp_file, progress_file)
                    break
                except PermissionError:
                    time.sleep(0.1)
                except Exception as e:
                    print(f"Error updating progress file: {e}", file=sys.stderr)
                    break
        except Exception as e:
            print(f"Error creating progress data: {e}", file=sys.stderr)
            pass

    def check_cancel():
        if stop_event and stop_event.is_set():
            update_progress_safe(0, 0, status="cancelled", message="Operação cancelada pelo usuário.")
            return True
        return False

    if check_cancel(): return

    files_in_directory = os.listdir(current_directory)

    # Carrega o arquivo de opções
    options_file = 'sources/options.json'
    with open(options_file, 'r', encoding='utf-8') as f:
        options_data = json.load(f)
        
    if check_cancel(): return

    # Procura por um arquivo que contenha "8800" no nome
    NFs_Workbook = 'sources/NFs.xlsx'
    if os.path.exists(NFs_Workbook):
        NFs_Data = pd.read_excel(NFs_Workbook, dtype={'Origem CST': str})
        # Converte a coluna Data_Fiscal para datetime
        NFs_Data['Data_Fiscal'] = pd.to_datetime(NFs_Data['Data_Fiscal'], dayfirst=True, errors='coerce')
    else:
        raise FileNotFoundError(f"Arquivo {NFs_Workbook} não encontrado.")

    if check_cancel(): return

    # Define as datas de início e fim com base nas opções
    start_date = pd.to_datetime(options_data['start_date'])
    end_date = pd.to_datetime(options_data['end_date']) + pd.offsets.MonthEnd(0)

    BOM_Workbook = 'sources/BOM.xlsx'
    if os.path.exists(BOM_Workbook):
        BOM_Data = pd.read_excel(BOM_Workbook)
    else:
        raise FileNotFoundError(f"Arquivo {BOM_Workbook} não encontrado.")

    if check_cancel(): return

    # Filtra BOM_Data com base no projeto
    project_filter = options_data['project']
    train = options_data['train']
    if 'Projeto' in BOM_Data.columns:
        BOM_Data = BOM_Data[BOM_Data['Projeto'] == project_filter]
        if train != "All":
            BOM_Data = BOM_Data[
                BOM_Data['Trem'].astype(str).str.strip() == str(train).strip()
            ]
            
    if check_cancel(): return

    Conv_Workbook = 'sources/Conversoes.xlsx'
    if os.path.exists(Conv_Workbook):
        Conv_Data = pd.read_excel(Conv_Workbook)
    else:
        # Se não existir, cria vazio ou lança erro? Vamos assumir que pode não existir ou criar vazio
        Conv_Data = pd.DataFrame() # Evita erro se não usado, ou lança erro se essencial

    if check_cancel(): return

    SubSystem_Workbook = 'sources/SubSystem.xlsx'
    if os.path.exists(SubSystem_Workbook):
        SubSystem_Data = pd.read_excel(SubSystem_Workbook)
    
    if check_cancel(): return

    POs_Workbook = 'sources/POs.xlsx'
    if os.path.exists(POs_Workbook):
        POs_Data = pd.read_excel(POs_Workbook)
    else:
        POs_Data = pd.DataFrame()

    if check_cancel(): return

    # --------------- Cria o arquivo Excel para armazenar os resultados ------------------

    # --------------- Cria o arquivo Excel para armazenar os resultados ------------------
    # Define o caminho para a pasta de Downloads
    output_folder = os.path.join(os.environ['USERPROFILE'], 'Downloads')

    if str(train).strip() == "All":
        filename_base = f"Liquidez {project_filter} - {mes_atual()}"
    else:
        filename_base = f"Liquidez {project_filter} Trem {train} - {mes_atual()}"

    output_file = os.path.join(output_folder, f"{filename_base}.xlsx")

    wb = Workbook()
    ws = wb.active

    data_atual = datetime.datetime.now()
    ws.title = "Relatorio"
    # Adiciona o cabeçalho
    cols = [
        "PO",
        "Codigo Unico BOM",
        "Efetividade",
        "Componente",
        "Nível",
        "Descricao_Componente",
        "UM_BOM",
        "Data_Fiscal",
        "N° Documento",
        "Tipo Documento",
        "Qtd_BOM",
        "Qtd_Consumido_BOM",
        "Qtd_Restante_BOM",
        "Qtd_PO",
        "Qtd_Consumido_PO",
        "Qtd_Restante_PO",
        "UM_PO",
        "Qtd_NF",
        "Qtd_Consumido_NF",
        "Qtd_Restante_NF",
        "UM_NF",
        "NF_Integralmente_Processada",
        "BOM_Integralmente_Processada",
        "PO_Integralmente_Processada",
        "NCM",
        "Chave_de_Acesso",
        "CPF_CGC_Pessoa_PF_PJ",
        "Razao_Social_da_Pessoa_PF_PJ",
        "Valor_Contabil",
        "Aliquota",
        "Valor_Contabil_Sem_Imposto",
        "Unidade_de_Medida",
        "Preco_Liquido",
        "Preco_Liquido_Sem_Imposto",
        "Pais",
        "Origem_CST",
        "CST_ICMS",
        "Aliquota_ICMS",
        "Aliquota_IPI",
        "Aliquota_PIS",
        "Aliquota_COFINS",
        "Valor_Contabil_Consumido",
        "Valor_Contabil_Consumido_Sem_Imposto",
        "Moeda",
        "Cod_Produto_BNDES",
    ]

    # Adicionar os cabeçalhos à planilha
    ws.append(cols)

    # ----------- Resetar para Gerar Relatorio do 0 ----------------
    NFs_Data['Processado'] = False # Processado = False, Significa que aquele material
    # de mesma NF 
    BOM_Data['Processado'] = False # Processado = False, significa que aquele material
    # Ainda precisa de notas para ser Zerado
    POs_Data['Processado'] = False
    POs_Data['Qtd_Restante_PO'] = POs_Data['Qtd.do pedido']
    POs_Data['Processado'] = False

    report_data = []

    # ----------- Gerar Relatorio BNDES ----------------

    progress_file = os.path.join(current_directory, 'sources', 'progress.json')
    total_bom_items = int(len(BOM_Data))
    processed_bom_items = 0

    def update_progress_safe(current, total, status="running", message=None):
        temp_file = progress_file + '.tmp'
        try:
            data = {
                "status": status,
                "current": current,
                "total": total,
            }
            if message:
                data["message"] = message
                
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(data, f)
            
            # Retry logic for Windows file locking
            max_retries = 10
            for i in range(max_retries):
                try:
                    if os.path.exists(progress_file):
                        os.remove(progress_file)
                    os.rename(temp_file, progress_file)
                    break
                except PermissionError:
                    time.sleep(0.1)
                except Exception as e:
                    print(f"Error updating progress file (loop): {e}", file=sys.stderr)
                    break
        except Exception as e:
            print(f"Error creating progress data (loop): {e}", file=sys.stderr)
            pass

    # Inicializa progresso
    update_progress_safe(0, total_bom_items)

    # -------------------- Processar BOM x NFs (Mostra as NFs usadas) --------------------
    # Define intervalo de atualização (1% ou a cada 1 item se for pequeno)
    update_interval = max(1, int(total_bom_items / 100))

    for index_bom, row_bom in BOM_Data.iterrows():
        if stop_event and stop_event.is_set():
            update_progress_safe(processed_bom_items, total_bom_items, status="error", message="Processamento cancelado pelo usuário.")
            return

        if processed_bom_items % update_interval == 0:
            update_progress_safe(processed_bom_items, total_bom_items)
        if row_bom['Processado'] == False:
            # Busca todas as NFs com o componente analisado
            componente = row_bom['Componente']
            qtd_restante_bom = row_bom['Qtd_Restante_BOM']
            um_componente = row_bom['Unidade_De_Medida']
            efetividade = row_bom['Efetividade']
            nivel = row_bom['Nivel_Explosao']
            cod_item = row_bom['Numero_Do_Item']

            cod_unico_bom = str(efetividade) + str(componente) + str(nivel)

            # NFs
            Nfs_componente = NFs_Data[
                (NFs_Data['Material'] == componente) & 
                (NFs_Data['Processado'] == False) &
                (NFs_Data['Data_Fiscal'] >= start_date) & 
                (NFs_Data['Data_Fiscal'] <= end_date)
            ].copy()
            Nfs_componente.sort_values(by='Data_Fiscal', inplace=True) # Orderna menor para o maior

            # Ordenação: 1) Data_Fiscal crescente; 2) Numero_NF decrescente (para desempate)
            Nfs_componente.sort_values(
                by=['Data_Fiscal', 'NF'],
                ascending=[True, False],
                inplace=True
            )

            # --------- Looping pelas NFs ate zerar a Qtd_Restante na BOM -----------
            for index_nf, row_nf in Nfs_componente.iterrows():
                # Analisa UM e faz a conversão
                UM_Nf = row_nf['UnidadeDeMedida']
                qtd_restante_nf = row_nf['Qtnd_restante_NF']
                um_nf = row_nf['UnidadeDeMedida']

                if um_nf.lower().strip() != um_componente.lower().strip():
                    qtd_restante_nf, um_nf,fator_conv = convert_um(componente, qtd_restante_nf, um_nf, Conv_Data)
                else:
                    fator_conv = 1
                
                qtd_restante_nf = smart_round(qtd_restante_nf)

                # Analisa se a Qtd na NF supre tudo ou não
                if um_nf == "Erro" or NFs_Data.loc[index_nf,'Processado']:
                    continue
                
                # Lógica de quanto devo descontar da BOM
                # Agora qtd_restante_nf já está na unidade da BOM (convertida ou não)
                if qtd_restante_nf > qtd_restante_bom:
                    qtd_descontar_bom = qtd_restante_bom
                else:
                    qtd_descontar_bom = qtd_restante_nf
                
                qtd_descontar_bom = smart_round(qtd_descontar_bom)

                # Calculamos o equivalente para abater da NF (Voltando para unidade da NF)
                # Se BOM = NF * Fator -> NF = BOM / Fator
                qtd_descontar_nf = qtd_descontar_bom / fator_conv
                qtd_descontar_nf = smart_round(qtd_descontar_nf)

                # Descontar valores para o balance
                BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'] -= qtd_descontar_bom
                
                # Precisamos usar round para evitar problemas de ponto flutuante que deixam residuos (ex: 0.000000001)
                if round(qtd_restante_nf, 6) > round(qtd_descontar_bom, 6):
                    NFs_Data.loc[index_nf, 'Qtnd_restante_NF'] -= qtd_descontar_nf
                else:
                    NFs_Data.loc[index_nf, 'Qtnd_restante_NF'] = 0
                
                # Realiza o balanceamento da BOM
                qtd_restante_bom = BOM_Data.loc[index_bom, 'Qtd_Restante_BOM']
                qtd_restante_bom = smart_round(qtd_restante_bom)
                BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'] = qtd_restante_bom

                if NFs_Data.loc[index_nf, 'Qtnd_restante_NF'] == 0:
                    NFs_Data.loc[index_nf, 'Processado'] = True
                
                # Define se a NF foi integralmente processada
                nf_processada = bool(qtd_descontar_bom == qtd_restante_nf)
                bom_processada = bool(qtd_restante_bom == 0)

                # Arrumando a data para o formato desejado
                data_fiscal_val = row_nf["Data_Fiscal"]
                if not pd.isna(data_fiscal_val):
                    data_fiscal_val = data_fiscal_val.strftime("%d/%m/%Y")
                else:
                    data_fiscal_val = ""
                    
                # Balance da PO
                """po_mask = (POs_Data['Material'] == componente) & \
                          (POs_Data['Processado'] == False)
                
                indices_po = POs_Data[po_mask].index
                indices_po = POs_Data[po_mask].sort_values(
                    by='Qtd.do pedido',
                    ascending=False
                ).index"""
                
                qtd_po_val = "S/ PO"
                qtd_consumido_po_val = "S/ PO"
                qtd_restante_po_val = "S/ PO"
                po_processada_val = "S/ PO"
                um_po = "S/ PO"

                """if len(indices_po) > 0:
                    idx_po = indices_po[0]
                    
                    # Assume a unidade da PO é a mesma da NF (fluxo de compra padrão)
                    deducao_po = qtd_descontar_nf
                    
                    POs_Data.loc[idx_po, 'Qtd_Restante_PO'] -= deducao_po
                    
                    qtd_po_val = POs_Data.loc[idx_po, 'Qtd.do pedido']
                    qtd_consumido_po_val = deducao_po
                    qtd_restante_po_val = POs_Data.loc[idx_po, 'Qtd_Restante_PO']
                    um_po = POs_Data.loc[idx_po, 'Unid.prç.pedido']
                    
                    if qtd_restante_po_val == 0:
                        POs_Data.loc[idx_po, 'Processado'] = True
                        po_processada_val = True
                    else:
                        po_processada_val = False"""

                # Inserção da linha e seus valores
                linha = [
                    row_nf['PO'], # PO
                    row_bom['CodUnico'], # Codigo Unico BOM
                    row_bom['Efetividade'], # Efetividade
                    row_bom["Componente"], # Componente
                    row_bom["Nivel_Explosao"], # Nível
                    row_bom["Desc_Componente"], # Descricao_Componente
                    row_bom["Unidade_De_Medida"], # UM_BOM
                    data_fiscal_val, # Data_Fiscal
                    row_nf["NF"], # N° Documento
                    "NF", # Tipo Documento
                    row_bom["QtdComponente"], # Qtd_Componente_BOM
                    qtd_descontar_bom, # Qtd_Consumido_BOM
                    BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'], # Qtd_Restante_BOM
                    qtd_po_val, # Qtd_PO
                    qtd_consumido_po_val, # Qtd_Consumido_PO
                    qtd_restante_po_val, # Qtd_Restante_PO
                    um_po, # UM_PO
                    NFs_Data.loc[index_nf, 'Quantidade'], # Qtd_NF
                    qtd_descontar_nf, # Qtd_Descontado_NF,
                    NFs_Data.loc[index_nf, 'Qtnd_restante_NF'], # Qtd_Restante_NF
                    row_nf['UnidadeDeMedida'], # UM_NF
                    nf_processada, # NF_Integralmente_Processada
                    bom_processada, # BOM_Integralmente_Processada
                    po_processada_val, # PO_Integralmente_Processada
                    row_nf["NCM"], # NCM
                    row_nf["Chave_de_Acesso"], # Chave_de_Acesso
                    row_nf["CPF_CGC_PF_PJ"], # CPF_CGC_Pessoa_PF_PJ
                    row_nf["Razao_Social_da_Pessoal_PF_PJ"], # Razao_Social_da_Pessoa_PF_PJ
                    row_nf["Valor_Contabil"], # Valor_Contabil
                    row_nf["Aliquota"], # Aliquota
                    row_nf["Valor_Contabil_Sem_Imposto"], # Valor_Contabil_Sem_Imposto
                    row_nf["UnidadeDeMedida"], # Unidade_de_Medida
                    row_nf["Preco_Liquido"], # Preco_Liquido
                    row_nf["Preco_Liquido_Sem_Imposto"], # Preco_Liquido_Sem_Imposto
                    row_nf["Pais"], # Pais
                    str(row_nf["Origem"]), # Origem_CST
                    str(row_nf["CST_ICMS"]), # CST_ICMS
                    row_nf["Aliquota_ICMS"], # Aliquota_ICMS
                    row_nf["Aliquota_IPI"], # Aliquota_IPI
                    row_nf["Aliquota_PIS"], # Aliquota_PIS
                    row_nf["Aliquota_COFINS"], # Aliquota_COFINS
                    qtd_descontar_nf * row_nf["Preco_Liquido"], # Valor_Contabil_Consumido
                    qtd_descontar_nf * row_nf["Preco_Liquido_Sem_Imposto"], # Valor_Contabil_Consumido_Sem_Imposto
                    row_nf["Moeda"], # Moeda
                    row_nf["Cod_Produto_BNDES"], # Cod_Produto_BNDES
                ]
                
                ws.append(linha) # Adiciona a linha
                
                # ----------- Termina Looping da BOM ------------
                if BOM_Data.loc[index_bom,'Qtd_Restante_BOM'] == 0:
                    BOM_Data.loc[index_bom,'Processado'] = True
                    break

            processed_bom_items += 1

    # -------------------- Processar BOM x POs (Mostra as POs usadas) --------------------
    # Filtra apenas os itens da BOM que ainda não foram processados (Processado == False)
    BOM_Data_Pending = BOM_Data[BOM_Data['Processado'] == False]
    
    POs_Workbook = 'sources/POs Pendentes.xlsx'
    if not os.path.exists(POs_Workbook):
        POs_Workbook = 'sources/POs.xlsx'
        
    if os.path.exists(POs_Workbook):
        POs_Data = pd.read_excel(POs_Workbook)
        POs_Data['Processado'] = False
        POs_Data['Qtnd_restante_PO'] = POs_Data['Quantidade']
    else:
        # Se não tiver arquivo de POs, cria um dataframe vazio para não quebrar o loop
        POs_Data = pd.DataFrame(columns=['Cód. Produto', 'Processado', 'Quantidade', 'Qtnd_restante_PO', 'Unidade de Medida', 'PO', 'NCM', 'CPF_CGC Pessoa Fis/Jur', 'Razao social da Pessoa Fis/Jur', 'Valor Contabil', 'Valor Contabil Total PER', 'Preço Liquido Unitário\nCOM IMPOSTO', 'Preço Liquido Total Per\nSEM IMPOSTO', 'Pais', 'CST ICMS', 'MOEDA'])

    count_phase2 = 0
    for index_bom, row_bom in BOM_Data_Pending.iterrows():
        if stop_event and stop_event.is_set():
            update_progress_safe(processed_bom_items, total_bom_items, status="error", message="Processamento cancelado pelo usuário.")
            return

        count_phase2 += 1
        # Mantém o progresso em 100% durante a fase 2, mas continua atualizando o status se necessário
        # Para evitar confusão, vamos manter o total como referência
        if count_phase2 % 5 == 0:
            update_progress_safe(total_bom_items, total_bom_items, status="running_phase2")

        # POs
        componente = row_bom["Componente"]
        POs_componente = POs_Data[
                (POs_Data['Cód. Produto'] == componente) & 
                (POs_Data['Processado'] == False)
            ].copy()

        # --------- Looping pelas POs ate mostrar os itens que ainda tem POs a serem consumidas/não tem NFs -----------
        for index_po, row_po in POs_componente.iterrows():
            # Analisa UM e faz a conversão
            qtd_restante_po = row_po['Qtnd_restante_PO']
            um_po = row_po['Unidade de Medida']
            um_bom = row_bom['Unidade_De_Medida']
            qtd_restante_bom = row_bom['Qtd_Restante_BOM']

            if um_po.lower().strip() != um_bom.lower().strip():
                qtd_restante_po, um_po,fator_conv = convert_um(componente, qtd_restante_po, um_po, Conv_Data)
            else:
                fator_conv = 1
            
            qtd_restante_po = smart_round(qtd_restante_po)

            # Analisa se a Qtd na PO supre tudo ou não
            if um_po == "Erro" or POs_Data.loc[index_po,'Processado']:
                continue
            
            # Lógica de quanto devo descontar da BOM
            # Agora qtd_restante_po já está na unidade da BOM (convertida ou não)
            if qtd_restante_po > qtd_restante_bom:
                qtd_descontar_bom = qtd_restante_bom
            else:
                qtd_descontar_bom = qtd_restante_po
            
            qtd_descontar_bom = smart_round(qtd_descontar_bom)

            # Calculamos o equivalente para abater da NF (Voltando para unidade da NF)
            # Se BOM = NF * Fator -> NF = BOM / Fator
            qtd_descontar_po = qtd_descontar_bom / fator_conv
            qtd_descontar_po = smart_round(qtd_descontar_po)

            # Descontar valores para o balanceamento da BOM
            BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'] -= qtd_descontar_bom
            
            # Precisamos usar round para evitar problemas de ponto flutuante que deixam residuos (ex: 0.000000001)
            if round(qtd_restante_po, 6) > round(qtd_descontar_bom, 6):
                POs_Data.loc[index_po, 'Qtnd_restante_PO'] -= qtd_descontar_bom
            else:
                POs_Data.loc[index_po, 'Qtnd_restante_PO'] = 0
            
            # Realiza o balanceamento da BOM
            qtd_restante_bom = BOM_Data.loc[index_bom, 'Qtd_Restante_BOM']
            qtd_restante_bom = smart_round(qtd_restante_bom)
            BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'] = qtd_restante_bom

            if NFs_Data.loc[index_po, 'Qtnd_restante_NF'] == 0:
                POs_Data.loc[index_po, 'Processado'] = True
            
            # Define se a PO foi integralmente processada
            po_processada = bool(qtd_descontar_bom == qtd_restante_po)
            bom_processada = bool(qtd_restante_bom == 0)

            # Arrumando a data para o formato desejado
            data_fiscal_val = "01/01/1900"

            # Inserção da linha e seus valores
            linha = [
                row_po['PO'], # PO
                row_bom['CodUnico'], # Codigo Unico BOM
                row_bom['Efetividade'], # Efetividade
                row_bom["Componente"], # Componente
                row_bom["Nivel_Explosao"], # Nível
                row_bom["Desc_Componente"], # Descricao_Componente
                row_bom["Unidade_De_Medida"], # UM_BOM
                data_fiscal_val, # Data_Fiscal
                row_po["PO"], # N° Documento
                "PO", # Tipo Documento
                row_bom["QtdComponente"], # Qtd_Componente_BOM
                qtd_descontar_bom, # Qtd_Consumido_BOM
                BOM_Data.loc[index_bom, 'Qtd_Restante_BOM'], # Qtd_Restante_BOM
                row_po['Quantidade'], # Qtd_PO
                qtd_descontar_po, # Qtd_Consumido_PO
                POs_Data.loc[index_po, 'Qtnd_restante_PO'], # Qtd_Restante_PO
                um_po, # UM_PO
                "S/ NF", # Qtd_NF
                "S/ NF", # Qtd_Descontado_NF,
                "S/ NF", # Qtd_Restante_NF
                "S/ NF", # UM_NF
                "S/ NF", # NF_Integralmente_Processada
                bom_processada, # BOM_Integralmente_Processada
                po_processada, # PO_Integralmente_Processada
                row_po["NCM"], # NCM
                "S/ NF", # Chave_de_Acesso
                row_po["CPF_CGC Pessoa Fis/Jur"], # CPF_CGC_Pessoa_PF_PJ
                row_po["Razao social da Pessoa Fis/Jur"], # Razao_Social_da_Pessoa_PF_PJ
                row_po["Valor Contabil"], # Valor_Contabil
                "S/ NF", # Aliquota
                row_po["Valor Contabil Total PER"], # Valor_Contabil_Sem_Imposto
                "S/ NF", # Unidade_de_Medida
                row_po["Preço Liquido Unitário\nCOM IMPOSTO"], # Preco_Liquido
                row_po["Preço Liquido Total Per\nSEM IMPOSTO"], # Preco_Liquido_Sem_Imposto
                row_po["Pais"], # Pais
                row_po["CST ICMS"], # Origem_CST
                "S/ NF", # CST_ICMS
                "S/ NF", # Aliquota_ICMS
                "S/ NF", # Aliquota_IPI
                "S/ NF", # Aliquota_PIS
                "S/ NF", # Aliquota_COFINS
                qtd_descontar_po * row_po["Preço Liquido Unitário\nCOM IMPOSTO"], # Valor_Contabil_Consumido
                qtd_descontar_po * row_po["Preço Liquido Total Per\nSEM IMPOSTO"], # Valor_Contabil_Consumido_Sem_Imposto
                row_po["MOEDA"], # Moeda
                "S/ NF", # Cod_Produto_BNDES
            ]
            
            ws.append(linha) # Adiciona a linha        

    update_progress_safe(total_bom_items, total_bom_items, status="saving")
    try:
        wb.save(output_file)
        update_progress_safe(total_bom_items, total_bom_items, status="done")
    except Exception as e:
        update_progress_safe(total_bom_items, total_bom_items, status="error", message=f"Erro ao salvar arquivo: {str(e)}")
        raise e

    print(f"Arquivo Excel '{output_file}' gerado com sucesso.")

if __name__ == "__main__":
    main()
