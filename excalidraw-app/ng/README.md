# Símbolos NG

A aba **NG** na barra lateral adiciona um catálogo local ao editor.

## Biblioteca nativa

O botão **Adicionar 18 símbolos básicos à biblioteca** mescla o pacote nativo com a biblioteca atual. Não apaga itens existentes. Os 18 desenhos genéricos são grupos de formas editáveis.

## Coleções oficiais sem redistribuição

Selecione Azure, AWS, Google Cloud ou Microsoft 365 e abra a fonte indicada. Baixe o pacote oficial, confira seus termos e extraia os SVGs/PNGs. Importe até 100 arquivos por lote, no máximo 2 MB cada. Não importe arquivos sem autorização de uso. Dell usa a coleção VisioCafe como referência: direitos de redistribuição/conversão ainda precisam ser verificados; não há pacote Dell incorporado.

A importação é local: o catálogo fica em IndexedDB neste navegador, não em um servidor NG. O carregamento de um ícone no desenho utiliza os mecanismos normais de salvamento/colaboração do Excalidraw. Colaboração pode compartilhar o conteúdo do desenho com os participantes.

SVGs são recusados se contiverem scripts, eventos, entidades, foreignObject ou referências externas. São decodificados como imagens e convertidos em PNG de até 512 pixels, preservando proporção; não há inserção de SVG inline. Alguns SVGs legítimos com estilos complexos podem ser rejeitados. O arquivo oficial original permanece inalterado.

Clique em um item para inseri-lo no centro do canvas; depois arraste-o normalmente. Ícones importados são imagens, não formas vetoriais editáveis. A busca filtra nomes dentro da categoria. Arquivos iguais na mesma categoria são deduplicados pelo conteúdo. Exporte seus desenhos para backup: limpar os dados do navegador remove o catálogo local.

## Fontes e condições

- Azure: https://learn.microsoft.com/en-us/azure/architecture/icons/ — uso em diagramas, treinamento e documentação; sem distorcer, cortar ou usar como marca do produto NG.
- AWS: https://aws.amazon.com/architecture/icons/ — pacotes para diagramas e apresentações, sujeitos às condições AWS.
- Google Cloud: https://cloud.google.com/icons — coleção atual e separada dos ícones legados; consultar guia e termos do pacote.
- Microsoft 365: https://learn.microsoft.com/en-us/previous-versions/microsoft-365/solutions/architecture-icons-templates — coleção oficial arquivada e termos específicos.
- Dell: https://www.visiocafe.com/dell.htm — referência, autorização de redistribuição não confirmada.

Nenhum ícone de fornecedor é incluído ou relicenciado como MIT por este recurso. Os 18 símbolos genéricos são originais do projeto. Não há nova infraestrutura, serviço pago, telemetria adicional ou deploy automático.
