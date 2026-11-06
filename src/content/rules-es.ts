import type { RulesContent } from './types';

// Adaptado del reglamento de Agent Decker, de Manuel Correia (CC BY-NC 4.0).
// Cambios: formato adaptado a pantallas y notas donde la aplicación automatiza un paso.
// Las dudas resumen docs/rulings.md.

export const rulesEs: RulesContent = {
  sections: [
    {
      id: 'overview',
      title: 'Introducción',
      blocks: [
        'Eres agente secreto: acabas de salir de la escuela de espías y vas a aprender sobre el terreno. Esta es tu primera misión. Tu objetivo es localizar y rescatar a un rehén, pero antes tienes que conseguir equipo y mezclarte con el entorno.',
        'Agent Decker es un juego de construcción de mazos en solitario: unos 20 minutos por misión y 5 misiones en la campaña.',
      ],
    },
    {
      id: 'components',
      title: 'Componentes',
      blocks: [
        { list: ['1 carta de alarma', '8 cartas iniciales', '22 cartas en el mazo de obstáculos', '23 cartas en el mazo de misiones'] },
        'Total: 54 cartas. En esta aplicación no tienes que llevar la cuenta de la alarma.',
      ],
    },
    {
      id: 'cards',
      title: 'Tipos de cartas',
      blocks: [
        { h: 'Carta de alarma' },
        'A medida que te muevas por el complejo, irás levantando sospechas. Al principio, los guardias creerán que son imaginaciones suyas, pero si la alarma llega al máximo (50), irán a por ti. Fin de la partida.',
        { h: 'Cartas iniciales' },
        'Estas cartas te dan recursos, **Sigilo** {s} y **Combate** {f}, que puedes usar para **interactuar** con los obstáculos.',
        { h: 'Cartas de obstáculo' },
        'Estas cartas tienen dos partes. La mitad inferior representa el obstáculo y la superior es lo que obtendrás si lo desarmas.',
        { img: 'rules/card-anatomy.webp', alt: 'Anatomía de una carta de obstáculo, con las partes marcadas de A1 a A4' },
        {
          defs: [
            ['A1', 'Nombre del obstáculo'],
            ['A2', 'Tipo de obstáculo: persona {person}, lugar {location}, animal {animal}, electrónico {electronic} o puerta {door}'],
            ['A3', 'Los recursos necesarios para interactuar con este obstáculo'],
            ['A4', 'Cuánto sube la alarma si esta carta sale de la fila'],
          ],
        },
        '¡Puedes interactuar con cualquiera de los obstáculos! Para ello, primero pagas el coste indicado en la carta. Puede ser Sigilo {s}, Combate {f} o cualquier combinación de ambos {a}.',
        'Da igual qué recurso hayas usado: al interactuar, eliges si desarmas o noqueas el obstáculo:',
        {
          defs: [
            ['Desarmar', 'Saca la carta de obstáculo de la fila y añádela a tu zona de juego. Es una buena forma de conseguir equipo o mejores movimientos.'],
            [
              'Noquear',
              'Pon la carta boca abajo y déjala donde estaba en la fila. Las cartas noqueadas no suben la alarma durante el Avance de la fila, lo que te da más tiempo para completar la misión. Cuando una carta está noqueada, ignora su tipo y su efecto.',
            ],
          ],
        },
        'Algunas cartas de obstáculo tienen efectos que se activan a lo largo del turno. Pueden hacer que ellas mismas (u otras cartas) se deslicen, lo que obliga al resto de cartas de la fila a adaptarse a ese cambio.',
        'Ejemplo: el Guardia de patrulla se mueve más rápido que las demás cartas, así que en el Avance de la fila intercambia su lugar con la carta que tiene a su derecha.',
        { h: 'Cartas de objeto' },
        'Son iguales que las cartas de obstáculo normales, pero con un icono de **KEEP** en la parte superior. Cuando desarmas un obstáculo que tiene un objeto, en lugar de llevarlo a la zona de juego puedes equiparlo: ponlo en tu zona de equipo.',
        'Algunos objetos te dan bonificaciones que funcionan cada turno; otros se pueden descartar para obtener un efecto. ¡Pero no desaparecen! Puedes volver a equiparlos cuando los robes de nuevo.',
        { h: 'Cartas de misión' },
        'Hay dos tipos de cartas de misión: los **Objetivos de misión**, que fijan tu objetivo para la misión actual, y los **Obstáculos de misión**, que funcionan igual que los obstáculos normales. Los Objetivos de misión también tienen una recompensa en su mitad superior, que obtienes al completar esa misión.',
      ],
    },
    {
      id: 'line',
      title: 'La fila',
      blocks: [
        'La fila representa lo que ves mientras recorres el complejo enemigo. Ellos también te ven a ti, así que tienes que ocuparte de ellos antes de que salgan y den la alarma.',
        { img: 'rules/line.webp', alt: 'El mazo de obstáculos (B1), la fila de seis cartas (B2) y el descarte de obstáculos (B3)', wide: true },
        { defs: [['B1', 'Mazo de obstáculos'], ['B2', 'La fila'], ['B3', 'Descarte de obstáculos']] },
        'Al final del turno das un paso adelante, lo que te permite ver más del complejo. Imagínalo como una cinta transportadora: las cartas salen de la fila por la derecha y otras nuevas la rellenan por la izquierda.',
        'Algunas cartas de obstáculo tienen efectos que pueden cambiar la disposición de la fila o el comportamiento de otras cartas, así que asegúrate de leerlas a medida que aparezcan.',
      ],
    },
    {
      id: 'setup',
      title: 'Preparación',
      blocks: [
        'La aplicación hace la preparación por ti. Como referencia:',
        { img: 'rules/setup.webp', alt: 'Disposición de la mesa: el mazo de misiones y la alarma arriba; debajo, la fila, y después tu mazo, tu descarte, la zona de juego, la mano y la zona de equipo', wide: true },
        {
          defs: [
            ['C1', 'Coge las cartas de misión (objetivos y obstáculos) y ordénalas alfabéticamente según la letra de la esquina inferior derecha. Así se forma el mazo de misiones.'],
            ['C2', 'Coloca las dos fichas en las casillas del cero (0) del contador de alarma.'],
            ['C3', 'Baraja el mazo de obstáculos y roba seis cartas. Colócalas en fila, empezando por la derecha. Lee las cartas a medida que las robes, porque puede que se activen algunos efectos. Así se forma la fila.'],
            ['C4', 'Baraja tu mazo y roba cuatro cartas. Esta es tu mano inicial.'],
          ],
        },
        { h: 'Zonas de la mesa' },
        { defs: [['D1', 'Descarte de obstáculos'], ['D2', 'Tu mazo'], ['D3', 'Tu descarte'], ['D4', 'Zona de juego'], ['D5', 'Zona de equipo']] },
      ],
    },
    {
      id: 'goal',
      title: 'El objetivo del juego',
      blocks: [
        'El objetivo del juego es completar una serie de misiones sin alertar al complejo enemigo. Para ello, mejorarás tu mazo añadiendo nuevas armas y habilidades, y retirando las cartas innecesarias.',
      ],
    },
    {
      id: 'turn',
      title: 'Cómo se juega',
      blocks: [
        { h: '1 · Usar cartas' },
        'Usa las cartas de tu mano para enfrentarte a los obstáculos de la fila. No te preocupes por guardar cartas para el siguiente turno, porque se descartarán en la fase de Renovación de cartas.',
        'Al jugar cartas obtienes recursos que puedes usar para interactuar con los obstáculos. Entonces tienes que elegir: ¿lo desarmas o lo noqueas?',
        'Cuando usas o descartas una carta, no va directamente a tu descarte, sino que se coloca en la zona de juego.',
        'Al principio solo puedes interactuar con una carta de obstáculo por turno, pero eso cambiará a medida que avances en el juego y mejoren tus habilidades.',
        'Cuando hayas alcanzado tu límite de interacciones por turno, o no quieras hacer nada más este turno, pasa a la siguiente fase (**Fin del turno**).',
        { h: '2 · Comprobación de la misión' },
        'Comprueba si puedes cumplir o pagar el objetivo de la misión. Si es así, ¡la has completado! Consulta «Progresión de misiones» para preparar la siguiente. Si no, pasa al siguiente paso.',
        { h: '3 · Avance de la fila' },
        'Pon la última carta de la fila en el descarte de obstáculos y sube el contador de alarma en consecuencia. Desliza todas las cartas de la fila hacia la derecha.',
        { img: 'rules/scroll.webp', alt: 'Tras el avance: la última carta está en el descarte de obstáculos y las demás se han movido a la derecha, dejando huecos vacíos a la izquierda', wide: true },
        { h: '4 · Renovación de cartas' },
        'Roba nuevas cartas de obstáculo y colócalas a la izquierda de los obstáculos actuales. Debe haber seis cartas en la fila. Lee y, si es necesario, activa las cartas a medida que las coloques. Puede que tengas que reordenarlas.',
        'Si te quedas sin cartas que robar, baraja todas las cartas del descarte y úsalas como nuevo mazo. Esto vale tanto para los obstáculos como para tu mazo. Si no hay suficientes obstáculos para llenar la fila, se te ha acabado el tiempo y es el fin de la partida.',
        'Pon en tu descarte todas las cartas sin usar de tu mano y las cartas de la zona de juego. Roba cuatro cartas nuevas para tu próximo turno.',
      ],
    },
    {
      id: 'progression',
      title: 'Progresión de misiones',
      blocks: [
        {
          steps: [
            ['Recompensa', 'Cuando completas una misión, ¡obtienes una recompensa! La recompensa está en la propia carta de misión y va a tu zona de equipo. Es tuya, agente: te la has ganado. Las recompensas pueden ser recursos permanentes (utilizables una vez por turno) ¡o incluso reglas nuevas!'],
            ['Avanzar', 'Añade los siguientes obstáculos de misión al descarte de obstáculos. Si has completado la Misión 1 (A), añade los siguientes obstáculos de misión (B).'],
            ['Nueva fila', 'Baraja juntos el descarte de obstáculos, la fila y el mazo de obstáculos para formar el mazo de la siguiente misión. Roba seis cartas nuevas para formar la fila y aplica los efectos de los obstáculos a medida que aparezcan.'],
            ['Reiniciar la alarma', 'Vuelve a poner la alarma a cero (0).'],
            ['Barajar', 'Baraja juntas todas las cartas de la zona de juego, tu descarte y tu mazo para formar un nuevo mazo. Los objetos equipados y las Nuevas reglas se quedan en la mesa para la siguiente misión.'],
            ['Robar', 'Roba cuatro cartas de tu mazo para formar tu nueva mano, ¡y a por todas!'],
          ],
        },
      ],
    },
    {
      id: 'score',
      title: 'Puntuación',
      blocks: [
        'Se registra la alarma que tenías al terminar cada misión. Al acabar la campaña, se suman para obtener tu puntuación total. Representa la alarma total que has provocado durante la campaña, así que ¡te interesa que sea lo más baja posible!',
      ],
    },
  ],
  faq: [
    {
      title: 'La alarma y la fila',
      items: [
        { q: '¿Desarmar un obstáculo sube la alarma?', a: 'No. La alarma solo sube cuando una carta boca arriba sale por el final de la fila durante el Avance de la fila.' },
        {
          q: 'Si desarmo la última carta de la fila, ¿ese turno no sale ninguna?',
          a: 'Sí que sale una. Siempre sale la carta que quede más a la derecha en la fila, por muy atrás que esté. Para que la alarma no suba, esa última carta tiene que estar noqueada.',
        },
        {
          q: '¿Qué pasa con el hueco que deja una carta desarmada?',
          a: 'Se queda vacío hasta el Avance de la fila, cuando las cartas se deslizan a la derecha y otras nuevas llenan la fila por la izquierda. Una posición vacía rompe la adyacencia: las cartas a ambos lados de un hueco no son adyacentes.',
        },
        { q: '¿Puedo interactuar con una carta noqueada?', a: 'No. Una vez noqueada una carta, no puedes desarmarla más tarde mientras siga boca abajo.' },
        { q: '¿Cuándo pierdo exactamente?', a: 'Cuando la alarma llega a 50 o cuando no hay suficientes obstáculos (mazo más descarte) para llenar la fila. Oficialmente, la campaña termina ahí; la aplicación también te permite reintentar la misión, y lo indica en las mejores puntuaciones.' },
      ],
    },
    {
      title: 'Recursos e interacciones',
      items: [
        { q: '¿Puedo repartir mis recursos entre varios obstáculos?', a: 'Sí. Los recursos de las cartas que juegas van a una reserva común para el turno, y puedes repartirlos entre tus interacciones. El coste de cada obstáculo se paga por separado, y lo que sobre se pierde al final del turno.' },
        { q: '¿Qué significa un coste de {a}?', a: 'Que puedes pagarlo con cualquier combinación de Sigilo {s} y Combate {f}.' },
        { q: '¿Necesito un recurso concreto para desarmar o para noquear?', a: 'No. Pagues con lo que pagues, eliges si desarmas o noqueas.' },
        { q: '¿Puedo usar una carta que acabo de desarmar?', a: 'Este turno no. Va a tu zona de juego y llega a tu mazo a través de tu pila de descartes. Los objetos con KEEP son la excepción: equípalos y funcionarán de inmediato.' },
        { q: '¿Qué cuenta como interacción?', a: 'Solo desarmar o noquear directamente una carta de la fila. Los efectos que mueven o dan la vuelta a cartas (como Distracción) no cuentan, ni tampoco las cartas noqueadas por la habilidad de otro obstáculo (Barril inflamable, Guardia torpe). Completar una misión tampoco es una interacción.' },
        { q: '¿Y si se me acaba el mazo?', a: 'Baraja tu pila de descartes para formar un nuevo mazo y sigue robando. Si ambos están vacíos, roba las que puedas. Las cartas de la zona de juego nunca se vuelven a barajar en mitad de un turno.' },
      ],
    },
    {
      title: 'Objetos y recompensas',
      items: [
        { q: '¿Cómo funcionan la Tarjeta de acceso, el Cloroformo y el P.E.M.?', a: 'Desde tu mano o tu zona de equipo, pon la carta en tu pila de descartes para interactuar con un obstáculo del tipo correspondiente sin pagar su coste: Tarjeta de acceso {door}, Cloroformo {person}, P.E.M. {electronic}. Sigue contando como una de tus interacciones, y las restricciones del Francotirador y del Halcón se siguen aplicando.' },
        { q: '¿Cómo funcionan el Uniforme de guardia, el Prisionero y el Mapa?', a: 'Mientras están equipados, cada uno te da su recurso una vez por turno y se queda en la mesa. El Uniforme de guardia y el Prisionero también se pueden jugar desde la mano como una carta de recurso normal.' },
        { q: '¿Equipar una carta de mi mano cuesta algo?', a: 'No. Equipar es gratis y no es una acción.' },
        { q: '¿Qué cuenta para «¡Equípate!»?', a: 'Cada carta con KEEP de tu zona de equipo, incluidos el Mapa y la recompensa de la Misión dos. Las recompensas de las Misiones tres y cuatro no tienen KEEP.' },
      ],
    },
    {
      title: 'Misiones',
      items: [
        { q: '¿Cómo completo una misión que dice «Consigue…»?', a: 'Trata el objetivo como un coste. Al final del turno necesitas tener esos recursos sin gastar. Los recursos que hayas usado en obstáculos no cuentan, y no puedes pagar un objetivo a lo largo de varios turnos.' },
        { q: '¿Dónde tienen que estar el Uniforme de guardia o el Prisionero?', a: 'En tu zona de equipo en el momento de la Comprobación de la misión. Puedes desarmarlo y equiparlo en el mismo turno en que completas la misión.' },
        { q: 'Misión tres: ¿qué cartas cuentan?', a: 'Solo las cartas de tu mano en la Comprobación de la misión. Las cartas que hayas jugado no cuentan.' },
        { q: 'Misión cinco: ¿qué necesito exactamente?', a: 'Las seis posiciones de la fila ocupadas por cartas noqueadas al mismo tiempo.' },
        { q: '¿Qué pasa cuando completo una misión?', a: 'El turno termina de inmediato: no hay Avance de la fila. Se registra tu alarma, obtienes la recompensa, los nuevos obstáculos de misión se añaden al mazo de obstáculos, la alarma se reinicia y todas tus cartas (incluida la mano) se vuelven a barajar. Las cartas retiradas del juego siguen fuera.' },
      ],
    },
    {
      title: 'Obstáculos',
      items: [
        { q: 'Guardia de patrulla', a: 'En el Avance de la fila, después de que salga la última carta y la fila se deslice, intercambia su lugar con la carta que tiene a su derecha. También avanza una posición más en cuanto entra en la fila. Un Guardia de patrulla que está al final de la fila no sale antes de tiempo.' },
        { q: 'Perro guardián', a: 'Cuando aparece, si hay una persona boca arriba en la fila, se desliza hacia la más cercana hasta quedar junto a ella. Nunca salta por encima de su objetivo.' },
        { q: 'Torre de radio', a: 'Cuando aparece, todas las personas boca arriba se deslizan hacia ella, desde cualquier lado, hasta quedar agrupadas junto a ella. Las cartas por las que pasan se desplazan para hacerles sitio.' },
        { q: 'Inspector', a: 'En cada Avance de la fila, después de que salga la última carta y la fila se deslice, el Inspector pone boca arriba la nueva última carta. Si esa carta tiene una habilidad «Cuando aparezca…», se activa.' },
        { q: 'Sirena', a: 'Si sale de la fila boca arriba, todas las demás cartas de la fila también van al descarte de obstáculos, pero solo la Sirena sube la alarma. Después se reparte una fila nueva completa.' },
        { q: 'Dormitorio', a: 'Mientras está boca arriba, las cartas noqueadas se quedan en su posición durante el deslizamiento y las cartas boca arriba las adelantan.' },
        { q: 'Francotirador', a: 'Solo puedes interactuar con él cuando es la única persona boca arriba de la fila. El Barril inflamable y el Guardia torpe tampoco pueden noquearlo.' },
        { q: 'Halcón', a: 'Mientras está boca arriba, no puedes interactuar con cartas que solo cuesten Sigilo {s}, ni siquiera con una Tarjeta de acceso. Los costes de {a} no se ven afectados, y las habilidades de otros obstáculos pueden seguir noqueando esas cartas.' },
        { q: 'Torre de vigilancia', a: 'Las cartas de las posiciones adyacentes cuestan 2 más de su propio recurso.' },
        { q: 'Barril inflamable', a: 'Siempre que interactúes con él (desarmándolo o noqueándolo), las cartas adyacentes quedan noqueadas. Que el Inspector le dé la vuelta no lo activa.' },
        { q: 'Guardia torpe', a: 'Paga su coste (una interacción) y, en lugar de desarmar o noquear al Guardia torpe, puedes noquear una carta adyacente. Si esa carta es el Barril inflamable, el barril también se activa.' },
      ],
    },
    {
      title: 'Tus cartas',
      items: [
        { q: 'Movimiento llamativo', a: 'Cuenta las cartas de tu pila de descartes en el momento de jugarla. Las cartas jugadas este turno están en la zona de juego, así que no cuentan. Redondea hacia abajo.' },
        { q: 'Despistar', a: 'Las cartas que pongas en la zona de juego te dan {s2} cada una, pero ningún otro efecto. Despistar no se cuenta a sí misma.' },
        { q: 'Papelera y Quemar', a: 'Las cartas retiradas desaparecen durante el resto de la campaña. Papelera no puede retirarse a sí misma.' },
        { q: 'Planificar, Previsión y Justo lo que necesitaba', a: 'Si a tu mazo le faltan cartas cuando miras las de arriba, primero se baraja tu pila de descartes y se coloca debajo. Con Planificar, la carta que conservas va a tu mano.' },
        { q: 'Intercambio', a: 'Tu pila de descartes pasa a ser tu mazo sin barajarse, con la carta más antigua arriba, y tu antiguo mazo pasa a ser tu pila de descartes.' },
        { q: 'Bazuca y Camuflaje óptico', a: 'Después de usarlos van al descarte de obstáculos, así que pueden volver a aparecer en la fila.' },
        { q: 'Ahorrar balas', a: 'Al final del turno conservas en la mano una carta sin usar. Cuenta para tu siguiente mano, así que robas una menos.' },
      ],
    },
    {
      title: 'Esta aplicación',
      items: [
        { q: '¿Puedo deshacer?', a: 'Puedes deshacer acciones del turno actual hasta que algo revele información oculta: robar, barajar, mirar tu mazo o que entre un obstáculo nuevo en la fila.' },
        { q: '¿Se guarda mi partida?', a: 'Sí, después de cada acción, en este navegador. Usa «Exportar partida» en el menú para guardar un archivo de copia de seguridad; algunos navegadores borran los datos guardados pasado un tiempo.' },
      ],
    },
  ],
};
